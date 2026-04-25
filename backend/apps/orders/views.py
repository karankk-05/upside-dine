from datetime import timedelta

from django.utils import timezone
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.payments.models import Payment
from .models import CanteenOrder
from .serializers import (
    CancelOrderSerializer,
    CanteenOrderListSerializer,
    CanteenOrderSerializer,
    ManagerOrderStatusUpdateSerializer,
    OrderStatusSerializer,
    PickupVerifySerializer,
    PlaceOrderSerializer,
)
from .services import (
    cancel_order,
    create_order_for_student,
    restore_order_inventory,
    validate_status_transition,
    verify_pickup,
)


class IsCanteenManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        return bool(user.role and user.role.role_name == "canteen_manager")


PAID_PAYMENT_STATUSES = [
    Payment.STATUS_AUTHORIZED,
    Payment.STATUS_CAPTURED,
    Payment.STATUS_REFUNDED,
]


def _visible_order_queryset(queryset):
    return queryset.filter(
        Q(payment__isnull=True) | Q(payment__status__in=PAID_PAYMENT_STATUSES)
    )


def _require_student_profile(request):
    if hasattr(request.user, "student_profile"):
        return request.user.student_profile
    return None


def _manager_canteen_ids(user):
    if user.is_superuser:
        return None
    if not hasattr(user, "staff_profile"):
        return []
    canteen_id = user.staff_profile.canteen_id
    return [canteen_id] if canteen_id else []


class OrderListCreateView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PlaceOrderSerializer

    def get(self, request):
        student_profile = _require_student_profile(request)
        if not student_profile:
            return Response(
                {"detail": "Only students can view personal order history from this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )
        orders = _visible_order_queryset(
            CanteenOrder.objects.filter(student=student_profile).select_related("canteen", "payment")
        )
        return Response(CanteenOrderListSerializer(orders, many=True).data)

    def post(self, request):
        student_profile = _require_student_profile(request)
        if not student_profile:
            return Response(
                {"detail": "Only students can place canteen orders."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = create_order_for_student(student_profile, serializer.validated_data)
        if serializer.validated_data.get("payment_method") == "razorpay":
            Payment.objects.update_or_create(
                order=order,
                defaults={
                    "amount": order.total_amount,
                    "currency": "INR",
                    "payment_method": "razorpay",
                    "status": Payment.STATUS_PENDING,
                },
            )
        return Response(CanteenOrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CanteenOrderSerializer

    def get_queryset(self):
        student_profile = _require_student_profile(self.request)
        if not student_profile:
            return CanteenOrder.objects.none()
        return _visible_order_queryset(
            CanteenOrder.objects.filter(student=student_profile)
            .select_related("canteen", "payment")
            .prefetch_related("items")
        )


class OrderCancelView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CancelOrderSerializer

    def post(self, request, id):
        student_profile = _require_student_profile(request)
        if not student_profile:
            return Response({"detail": "Only students can cancel their orders."}, status=status.HTTP_403_FORBIDDEN)
        order = CanteenOrder.objects.filter(id=id, student=student_profile).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            cancel_order(order, serializer.validated_data.get("reason", ""))
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderStatusSerializer(order).data)


class OrderStatusView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderStatusSerializer

    def get(self, request, id):
        student_profile = _require_student_profile(request)
        if not student_profile:
            return Response(
                {"detail": "Only students can check personal order status from this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )
        order = _visible_order_queryset(
            CanteenOrder.objects.filter(id=id, student=student_profile).select_related("payment")
        ).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(order).data)


class CanteenManagerOrderListView(ListAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = CanteenOrderSerializer

    def get_queryset(self):
        queryset = _visible_order_queryset(
            CanteenOrder.objects.select_related("canteen", "student", "student__user", "payment").prefetch_related("items")
        )
        manager_canteen_ids = _manager_canteen_ids(self.request.user)
        if manager_canteen_ids is not None:
            queryset = queryset.filter(canteen_id__in=manager_canteen_ids)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class CanteenManagerOrderDetailView(GenericAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = CanteenOrderSerializer

    def get(self, request, id):
        queryset = _visible_order_queryset(
            CanteenOrder.objects.select_related("canteen", "student", "student__user", "payment").prefetch_related("items__menu_item")
        )
        manager_canteen_ids = _manager_canteen_ids(request.user)
        if manager_canteen_ids is not None:
            queryset = queryset.filter(canteen_id__in=manager_canteen_ids)
        order = queryset.filter(id=id).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(order).data)


class CanteenManagerOrderAcceptView(GenericAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = OrderStatusSerializer

    def post(self, request, id):
        order = self._get_order(request, id)
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            validate_status_transition(order, CanteenOrder.STATUS_CONFIRMED)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        order.status = CanteenOrder.STATUS_CONFIRMED
        if not order.estimated_ready_time:
            order.estimated_ready_time = timezone.now() + timedelta(minutes=15)
        order.save(update_fields=["status", "estimated_ready_time", "updated_at"])
        return Response(self.get_serializer(order).data)

    def _get_order(self, request, order_id):
        queryset = _visible_order_queryset(CanteenOrder.objects.select_related("payment"))
        manager_canteen_ids = _manager_canteen_ids(request.user)
        if manager_canteen_ids is not None:
            queryset = queryset.filter(canteen_id__in=manager_canteen_ids)
        return queryset.filter(id=order_id).first()


class CanteenManagerOrderRejectView(GenericAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = OrderStatusSerializer

    def post(self, request, id):
        order = self._get_order(request, id)
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            validate_status_transition(order, CanteenOrder.STATUS_REJECTED)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        restore_order_inventory(order)
        order.status = CanteenOrder.STATUS_REJECTED
        order.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(order).data)

    def _get_order(self, request, order_id):
        queryset = _visible_order_queryset(CanteenOrder.objects.select_related("payment"))
        manager_canteen_ids = _manager_canteen_ids(request.user)
        if manager_canteen_ids is not None:
            queryset = queryset.filter(canteen_id__in=manager_canteen_ids)
        return queryset.filter(id=order_id).first()


class CanteenManagerOrderStatusUpdateView(GenericAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = ManagerOrderStatusUpdateSerializer

    def patch(self, request, id):
        order = self._get_order(request, id)
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        estimated_ready_time = serializer.validated_data.get("estimated_ready_time")
        try:
            validate_status_transition(order, new_status)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        update_fields = ["status", "updated_at"]
        order.status = new_status

        if estimated_ready_time:
            order.estimated_ready_time = estimated_ready_time
            update_fields.append("estimated_ready_time")

        # Assign delivery person if transitioning to out_for_delivery
        if new_status == CanteenOrder.STATUS_OUT_FOR_DELIVERY:
            from apps.users.models import User
            dp_id = request.data.get("delivery_person_id")
            if dp_id:
                try:
                    dp = User.objects.get(id=dp_id, role__role_name="delivery_person", is_active=True)
                    order.delivery_person = dp
                    order.delivery_accepted_at = timezone.now()
                    update_fields.extend(["delivery_person", "delivery_accepted_at"])
                except User.DoesNotExist:
                    return Response({"detail": "Delivery person not found."}, status=status.HTTP_404_NOT_FOUND)

        order.save(update_fields=update_fields)
        return Response(OrderStatusSerializer(order).data)

    def _get_order(self, request, order_id):
        queryset = _visible_order_queryset(CanteenOrder.objects.select_related("payment"))
        manager_canteen_ids = _manager_canteen_ids(request.user)
        if manager_canteen_ids is not None:
            queryset = queryset.filter(canteen_id__in=manager_canteen_ids)
        return queryset.filter(id=order_id).first()


class CanteenManagerVerifyPickupView(GenericAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = PickupVerifySerializer

    def post(self, request, id):
        order = self._get_order(request, id)
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            verify_pickup(
                order,
                pickup_otp=serializer.validated_data.get("pickup_otp", ""),
                pickup_qr_code=serializer.validated_data.get("pickup_qr_code", ""),
            )
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderStatusSerializer(order).data)

    def _get_order(self, request, order_id):
        queryset = _visible_order_queryset(CanteenOrder.objects.select_related("payment"))
        manager_canteen_ids = _manager_canteen_ids(request.user)
        if manager_canteen_ids is not None:
            queryset = queryset.filter(canteen_id__in=manager_canteen_ids)
        return queryset.filter(id=order_id).first()


class IsDeliveryPersonOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        return bool(user.role and user.role.role_name in ["delivery_person", "canteen_manager"])


def _delivery_canteen_id(user):
    if not hasattr(user, "staff_profile"):
        return None
    return user.staff_profile.canteen_id


class DeliveryAvailableOrdersView(ListAPIView):
    """Delivery orders that have no delivery person assigned (confirmed+)."""
    permission_classes = [IsAuthenticated, IsDeliveryPersonOrAdmin]
    serializer_class = CanteenOrderSerializer

    def get_queryset(self):
        canteen_id = _delivery_canteen_id(self.request.user)
        qs = CanteenOrder.objects.filter(
            order_type=CanteenOrder.ORDER_TYPE_DELIVERY,
            status__in=[
                CanteenOrder.STATUS_CONFIRMED,
                CanteenOrder.STATUS_PREPARING,
                CanteenOrder.STATUS_READY,
            ],
            delivery_person__isnull=True,
        ).select_related("canteen", "student").prefetch_related("items")
        if canteen_id:
            qs = qs.filter(canteen_id=canteen_id)
        return qs.order_by("-created_at")


class DeliveryMyOrdersView(ListAPIView):
    """Orders assigned to the logged-in delivery person."""
    permission_classes = [IsAuthenticated, IsDeliveryPersonOrAdmin]
    serializer_class = CanteenOrderSerializer

    def get_queryset(self):
        qs = CanteenOrder.objects.filter(
            delivery_person=self.request.user,
        ).select_related("canteen", "student").prefetch_related("items")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by("-updated_at")


class DeliveryAcceptOrderView(GenericAPIView):
    """Delivery person volunteers to deliver an order."""
    permission_classes = [IsAuthenticated, IsDeliveryPersonOrAdmin]
    serializer_class = OrderStatusSerializer

    def post(self, request, id):
        order = CanteenOrder.objects.filter(
            id=id,
            order_type=CanteenOrder.ORDER_TYPE_DELIVERY,
            status__in=[
                CanteenOrder.STATUS_CONFIRMED,
                CanteenOrder.STATUS_PREPARING,
                CanteenOrder.STATUS_READY,
            ],
            delivery_person__isnull=True,
        ).first()
        if not order:
            return Response(
                {"detail": "Order not found or already assigned."},
                status=status.HTTP_404_NOT_FOUND,
            )
        canteen_id = _delivery_canteen_id(request.user)
        if canteen_id and order.canteen_id != canteen_id:
            return Response(
                {"detail": "This order is not for your canteen."},
                status=status.HTTP_403_FORBIDDEN,
            )
        order.delivery_person = request.user
        order.delivery_accepted_at = timezone.now()
        # If food is already ready, move to out_for_delivery
        if order.status == CanteenOrder.STATUS_READY:
            order.status = CanteenOrder.STATUS_OUT_FOR_DELIVERY
            order.save(update_fields=["delivery_person", "delivery_accepted_at", "status", "updated_at"])
        else:
            order.save(update_fields=["delivery_person", "delivery_accepted_at", "updated_at"])
        return Response(self.get_serializer(order).data)


class DeliveryCompleteOrderView(GenericAPIView):
    """Mark an order as delivered – requires the student's OTP."""
    permission_classes = [IsAuthenticated, IsDeliveryPersonOrAdmin]
    serializer_class = OrderStatusSerializer

    def post(self, request, id):
        order = CanteenOrder.objects.filter(
            id=id,
            delivery_person=request.user,
            status=CanteenOrder.STATUS_OUT_FOR_DELIVERY,
        ).first()
        if not order:
            return Response(
                {"detail": "Order not found or not in delivery."},
                status=status.HTTP_404_NOT_FOUND,
            )
        otp = request.data.get("pickup_otp", "").strip()
        if not otp:
            return Response({"detail": "OTP is required to confirm delivery."}, status=status.HTTP_400_BAD_REQUEST)
        if otp != order.pickup_otp:
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        order.status = CanteenOrder.STATUS_DELIVERED
        order.delivered_at = timezone.now()
        order.save(update_fields=["status", "delivered_at", "updated_at"])
        return Response(self.get_serializer(order).data)
