from decimal import Decimal

from django.db.models import Count, Max, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import (
    GenericAPIView,
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.payments.models import Payment
from .filters import CanteenFilter, CanteenMenuItemFilter
from .models import Canteen, CanteenMenuCategory, CanteenMenuItem, CanteenPaymentConfig
from .serializers import (
    CanteenDetailSerializer,
    CanteenListSerializer,
    CanteenManagerStatsSerializer,
    CanteenMenuCategorySerializer,
    CanteenMenuItemSerializer,
    CanteenPaymentConfigSerializer,
    CanteenSearchResultSerializer,
    CategoryWithItemsSerializer,
)


class IsCanteenManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        return bool(user.role and user.role.role_name == "canteen_manager")


def _get_manager_canteens(user):
    if user.is_superuser:
        return Canteen.objects.all()
    if not hasattr(user, "staff_profile"):
        return Canteen.objects.none()
    canteen_id = user.staff_profile.canteen_id
    if not canteen_id:
        return Canteen.objects.none()
    return Canteen.objects.filter(id=canteen_id)


PAID_PAYMENT_STATUSES = [
    Payment.STATUS_AUTHORIZED,
    Payment.STATUS_CAPTURED,
    Payment.STATUS_REFUNDED,
]


def _visible_canteen_orders_queryset(queryset):
    return queryset.filter(Q(payment__isnull=True) | Q(payment__status__in=PAID_PAYMENT_STATUSES))


def _normalize_category_name(value):
    return " ".join(str(value or "").split())


def _coerce_menu_category_input(data, canteen):
    if "category" not in data:
        return data

    raw_category = data.get("category")
    if raw_category in (None, ""):
        data["category"] = None
        return data

    if not isinstance(raw_category, str):
        return data

    normalized_category = _normalize_category_name(raw_category)
    if not normalized_category:
        data["category"] = None
        return data

    if normalized_category.isdigit():
        data["category"] = int(normalized_category)
        return data

    existing_category = CanteenMenuCategory.objects.filter(
        canteen=canteen,
        category_name__iexact=normalized_category,
    ).first()
    if existing_category:
        data["category"] = existing_category.id
        return data

    max_display_order = (
        CanteenMenuCategory.objects.filter(canteen=canteen).aggregate(max_display_order=Max("display_order"))[
            "max_display_order"
        ]
        or 0
    )
    category = CanteenMenuCategory.objects.create(
        canteen=canteen,
        category_name=normalized_category.title(),
        display_order=max_display_order + 1,
    )
    data["category"] = category.id
    return data


class CanteenListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CanteenListSerializer
    queryset = Canteen.objects.filter(is_active=True)
    filterset_class = CanteenFilter


class CanteenDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CanteenDetailSerializer
    queryset = Canteen.objects.filter(is_active=True)


class CanteenCategoryListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CanteenMenuCategorySerializer

    def get_queryset(self):
        canteen_id = self.kwargs["id"]
        return CanteenMenuCategory.objects.filter(canteen_id=canteen_id, is_active=True)


class CanteenMenuView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CategoryWithItemsSerializer

    def get(self, request, id):
        canteen = Canteen.objects.filter(id=id, is_active=True).first()
        if not canteen:
            return Response({"detail": "Canteen not found."}, status=status.HTTP_404_NOT_FOUND)

        categories = CanteenMenuCategory.objects.filter(canteen=canteen, is_active=True)
        category_data = CategoryWithItemsSerializer(categories, many=True).data
        uncategorized_items = CanteenMenuItem.objects.filter(
            canteen=canteen, category__isnull=True, is_active=True, is_available=True
        ).order_by("item_name")

        return Response(
            {
                "canteen_id": canteen.id,
                "canteen_name": canteen.name,
                "categories": category_data,
                "uncategorized_items": CanteenMenuItemSerializer(uncategorized_items, many=True).data,
            }
        )


class CanteenSearchView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CanteenSearchResultSerializer
    filterset_class = CanteenMenuItemFilter

    def get_queryset(self):
        queryset = CanteenMenuItem.objects.filter(
            canteen__is_active=True,
            is_active=True,
            is_available=True,
        ).select_related("canteen", "category")
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(Q(item_name__icontains=query) | Q(description__icontains=query))
        return queryset.order_by("item_name")


class CanteenManagerMenuListCreateView(ListCreateAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = CanteenMenuItemSerializer

    def get_queryset(self):
        canteens = _get_manager_canteens(self.request.user)
        return CanteenMenuItem.objects.filter(canteen__in=canteens).select_related("canteen", "category")

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        canteen = None
        if not request.user.is_superuser:
            canteen = _get_manager_canteens(request.user).first()
            if not canteen:
                return Response(
                    {"detail": "No canteen assigned to this manager profile."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            data["canteen"] = canteen.id
        else:
            canteen = Canteen.objects.filter(id=data.get("canteen")).first()

        if canteen:
            data = _coerce_menu_category_input(data, canteen)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        category = serializer.validated_data.get("category")
        canteen = serializer.validated_data["canteen"]
        if category and category.canteen_id != canteen.id:
            return Response(
                {"detail": "Category does not belong to the provided canteen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CanteenManagerMenuDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = CanteenMenuItemSerializer

    def get_queryset(self):
        canteens = _get_manager_canteens(self.request.user)
        return CanteenMenuItem.objects.filter(canteen__in=canteens).select_related("canteen", "category")

    def patch(self, request, *args, **kwargs):
        item = self.get_object()
        data = request.data.copy()
        target_canteen = item.canteen
        if request.user.is_superuser and data.get("canteen"):
            target_canteen = Canteen.objects.filter(id=data.get("canteen")).first() or item.canteen

        data = _coerce_menu_category_input(data, target_canteen)
        serializer = self.get_serializer(item, data=data, partial=True)
        serializer.is_valid(raise_exception=True)

        next_canteen = serializer.validated_data.get("canteen", item.canteen)
        next_category = serializer.validated_data.get("category", item.category)
        if not request.user.is_superuser and next_canteen.id != item.canteen_id:
            return Response(
                {"detail": "Canteen managers cannot move menu items across canteens."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if next_category and next_category.canteen_id != next_canteen.id:
            return Response(
                {"detail": "Category does not belong to the selected canteen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        item = self.get_object()
        item.is_active = False
        item.is_available = False
        item.save(update_fields=["is_active", "is_available", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CanteenManagerCategoryListCreateView(ListCreateAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = CanteenMenuCategorySerializer

    def get_queryset(self):
        canteens = _get_manager_canteens(self.request.user)
        return CanteenMenuCategory.objects.filter(canteen__in=canteens)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not request.user.is_superuser:
            canteen = _get_manager_canteens(request.user).first()
            if not canteen:
                return Response(
                    {"detail": "No canteen assigned to this manager profile."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            data["canteen"] = canteen.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CanteenManagerStatsView(GenericAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = CanteenManagerStatsSerializer

    def get(self, request):
        from apps.orders.models import CanteenOrder

        canteens = _get_manager_canteens(request.user)
        if not canteens.exists():
            return Response([], status=status.HTTP_200_OK)

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        stats = []
        for canteen in canteens:
            orders = _visible_canteen_orders_queryset(
                CanteenOrder.objects.filter(canteen=canteen, created_at__gte=today_start)
            )
            aggregate = orders.aggregate(
                total_orders=Count("id"),
                total_revenue=Sum(
                    "total_amount",
                    filter=Q(status__in=["delivered", "picked_up"]),
                ),
                pending_orders=Count("id", filter=Q(status="pending")),
                preparing_orders=Count("id", filter=Q(status="preparing")),
                ready_orders=Count("id", filter=Q(status="ready")),
                completed_orders=Count("id", filter=Q(status__in=["delivered", "picked_up"])),
            )
            stats.append(
                {
                    "canteen_id": canteen.id,
                    "canteen_name": canteen.name,
                    "total_orders": aggregate.get("total_orders", 0),
                    "total_revenue": aggregate.get("total_revenue") or Decimal("0.00"),
                    "pending_orders": aggregate.get("pending_orders", 0),
                    "preparing_orders": aggregate.get("preparing_orders", 0),
                    "ready_orders": aggregate.get("ready_orders", 0),
                    "completed_orders": aggregate.get("completed_orders", 0),
                }
            )
        return Response(self.get_serializer(stats, many=True).data)


class CanteenPaymentConfigView(GenericAPIView):
    permission_classes = [IsCanteenManagerOrAdmin]
    serializer_class = CanteenPaymentConfigSerializer

    def get(self, request):
        canteen = _get_manager_canteens(request.user).first()
        if not canteen:
            return Response({"detail": "No canteen assigned."}, status=status.HTTP_404_NOT_FOUND)
        config, _ = CanteenPaymentConfig.objects.get_or_create(canteen=canteen)
        return Response(self.get_serializer(config).data)

    def put(self, request):
        canteen = _get_manager_canteens(request.user).first()
        if not canteen:
            return Response({"detail": "No canteen assigned."}, status=status.HTTP_404_NOT_FOUND)
        config, _ = CanteenPaymentConfig.objects.get_or_create(canteen=canteen)
        serializer = self.get_serializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
