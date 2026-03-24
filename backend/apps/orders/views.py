from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

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
from .services import cancel_order, create_order_for_student, validate_status_transition, verify_pickup


class IsCanteenManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        return bool(user.role and user.role.role_name == "canteen_manager")


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
        orders = CanteenOrder.objects.filter(student=student_profile).select_related("canteen")
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
        return Response(CanteenOrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CanteenOrderSerializer

    def get_queryset(self):
        student_profile = _require_student_profile(self.request)
        if not student_profile:
            return CanteenOrder.objects.none()
        return CanteenOrder.objects.filter(student=student_profile).select_related("canteen").prefetch_related("items")


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
        order = CanteenOrder.objects.filter(id=id, student=student_profile).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(order).data)


class CanteenManagerOrderListView(ListAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = CanteenOrderSerializer

    def get_queryset(self):
        queryset = CanteenOrder.objects.select_related("canteen", "student", "student__user").prefetch_related("items")
        manager_canteen_ids = _manager_canteen_ids(self.request.user)
        if manager_canteen_ids is not None:
            queryset = queryset.filter(canteen_id__in=manager_canteen_ids)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


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
        queryset = CanteenOrder.objects.all()
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
        order.status = CanteenOrder.STATUS_REJECTED
        order.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(order).data)

    def _get_order(self, request, order_id):
        queryset = CanteenOrder.objects.all()
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
        order.status = new_status
        if estimated_ready_time:
            order.estimated_ready_time = estimated_ready_time
            order.save(update_fields=["status", "estimated_ready_time", "updated_at"])
        else:
            order.save(update_fields=["status", "updated_at"])
        return Response(OrderStatusSerializer(order).data)

    def _get_order(self, request, order_id):
        queryset = CanteenOrder.objects.all()
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
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderStatusSerializer(order).data)

    def _get_order(self, request, order_id):
        queryset = CanteenOrder.objects.all()
        manager_canteen_ids = _manager_canteen_ids(request.user)
        if manager_canteen_ids is not None:
            queryset = queryset.filter(canteen_id__in=manager_canteen_ids)
        return queryset.filter(id=order_id).first()
