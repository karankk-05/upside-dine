from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.orders.models import CanteenOrder
from apps.users.permissions import IsStudent

from .models import Payment
from .serializers import (
    PaymentCreateOrderSerializer,
    PaymentRefundSerializer,
    PaymentSerializer,
    PaymentVerifySerializer,
)
from .services import (
    create_razorpay_order,
    initiate_refund,
    mark_payment_captured,
    mark_payment_failed,
    verify_payment_signature,
    verify_webhook_signature,
)


class IsCanteenManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        return bool(user.role and user.role.role_name == "canteen_manager")


def _get_order_for_student(user, order_id):
    if not hasattr(user, "student_profile"):
        return None
    return CanteenOrder.objects.filter(id=order_id, student=user.student_profile).first()


def _get_order_for_manager(user, order_id):
    queryset = CanteenOrder.objects.filter(id=order_id)
    if user.is_superuser:
        return queryset.first()
    if not hasattr(user, "staff_profile") or not user.staff_profile.canteen_id:
        return None
    return queryset.filter(canteen_id=user.staff_profile.canteen_id).first()


def _get_order_for_current_user(user, order_id):
    if user.is_superuser:
        return CanteenOrder.objects.filter(id=order_id).first()
    if hasattr(user, "student_profile"):
        return _get_order_for_student(user, order_id)
    if user.role and user.role.role_name == "canteen_manager":
        return _get_order_for_manager(user, order_id)
    return None


class PaymentCreateOrderView(GenericAPIView):
    permission_classes = [IsAuthenticated, IsStudent]
    serializer_class = PaymentCreateOrderSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = _get_order_for_student(request.user, serializer.validated_data["order_id"])
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                "amount": order.total_amount,
                "currency": "INR",
                "payment_method": "razorpay",
                "status": Payment.STATUS_PENDING,
            },
        )
        payment.amount = order.total_amount
        payment.payment_method = "razorpay"

        try:
            razorpay_order = create_razorpay_order(order)
            payment.razorpay_order_id = razorpay_order.get("id")
            payment.status = Payment.STATUS_PENDING
            payment.raw_response = razorpay_order
            payment.save(
                update_fields=[
                    "amount",
                    "payment_method",
                    "razorpay_order_id",
                    "status",
                    "raw_response",
                    "updated_at",
                ]
            )
        except Exception as exc:
            mark_payment_failed(payment, exc)
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "payment": PaymentSerializer(payment).data,
                "razorpay_key_id": getattr(settings, "RAZORPAY_KEY_ID", ""),
                "razorpay_order": payment.raw_response,
            },
            status=status.HTTP_200_OK,
        )


class PaymentVerifyView(GenericAPIView):
    permission_classes = [IsAuthenticated, IsStudent]
    serializer_class = PaymentVerifySerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        payment = Payment.objects.filter(
            order__student=request.user.student_profile,
            razorpay_order_id=data["razorpay_order_id"],
        ).select_related("order").first()
        if not payment:
            return Response({"detail": "Payment record not found."}, status=status.HTTP_404_NOT_FOUND)

        is_valid = verify_payment_signature(
            data["razorpay_order_id"],
            data["razorpay_payment_id"],
            data["razorpay_signature"],
        )
        if not is_valid:
            mark_payment_failed(payment, "Invalid payment signature.")
            return Response({"detail": "Invalid payment signature."}, status=status.HTTP_400_BAD_REQUEST)

        mark_payment_captured(
            payment,
            razorpay_payment_id=data["razorpay_payment_id"],
            razorpay_signature=data["razorpay_signature"],
            payload={"verification": data},
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


class PaymentWebhookView(GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        signature = request.headers.get("X-Razorpay-Signature", "")
        if not signature:
            return Response({"detail": "Missing Razorpay signature."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if not verify_webhook_signature(request.body, signature):
                return Response({"detail": "Invalid Razorpay webhook signature."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        event = request.data.get("event", "")
        payload = request.data.get("payload", {})

        if event in ("payment.captured", "payment.authorized"):
            payment_entity = payload.get("payment", {}).get("entity", {})
            razorpay_order_id = payment_entity.get("order_id")
            razorpay_payment_id = payment_entity.get("id")
            if razorpay_order_id:
                payment = Payment.objects.filter(razorpay_order_id=razorpay_order_id).first()
                if payment:
                    payment.status = (
                        Payment.STATUS_CAPTURED if event == "payment.captured" else Payment.STATUS_AUTHORIZED
                    )
                    payment.razorpay_payment_id = razorpay_payment_id
                    if event == "payment.captured":
                        payment.captured_at = timezone.now()
                    payment.raw_response = request.data
                    payment.save(
                        update_fields=[
                            "status",
                            "razorpay_payment_id",
                            "captured_at",
                            "raw_response",
                            "updated_at",
                        ]
                    )

        if event == "refund.processed":
            refund_entity = payload.get("refund", {}).get("entity", {})
            razorpay_payment_id = refund_entity.get("payment_id")
            refund_amount = Decimal(refund_entity.get("amount", 0)) / Decimal("100")
            if razorpay_payment_id:
                payment = Payment.objects.filter(razorpay_payment_id=razorpay_payment_id).first()
                if payment:
                    payment.status = Payment.STATUS_REFUNDED
                    payment.refund_amount = refund_amount
                    payment.refunded_at = timezone.now()
                    payment.raw_response = request.data
                    payment.save(
                        update_fields=["status", "refund_amount", "refunded_at", "raw_response", "updated_at"]
                    )

        return Response({"detail": "Webhook processed."}, status=status.HTTP_200_OK)


class PaymentRefundView(GenericAPIView):
    permission_classes = [IsAuthenticated, IsCanteenManagerOrAdmin]
    serializer_class = PaymentRefundSerializer

    def post(self, request, order_id):
        order = _get_order_for_manager(request.user, order_id)
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        payment = Payment.objects.filter(order=order).first()
        if not payment:
            return Response({"detail": "Payment not found for this order."}, status=status.HTTP_404_NOT_FOUND)
        if payment.status not in (Payment.STATUS_CAPTURED, Payment.STATUS_AUTHORIZED):
            return Response(
                {"detail": f"Refund is allowed only for captured/authorized payments. Current: {payment.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data.get("amount")

        try:
            response_data, refund_amount = initiate_refund(payment, amount)
            payment.status = Payment.STATUS_REFUNDED
            payment.refund_amount = refund_amount
            payment.refunded_at = timezone.now()
            payment.raw_response = response_data
            payment.save(update_fields=["status", "refund_amount", "refunded_at", "raw_response", "updated_at"])
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


class PaymentStatusView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer

    def get(self, request, order_id):
        order = _get_order_for_current_user(request.user, order_id)
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        payment = Payment.objects.filter(order=order).first()
        if not payment:
            return Response({"order_id": order.id, "order_number": order.order_number, "status": "not_initiated"})
        return Response(self.get_serializer(payment).data)
