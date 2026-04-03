from django.urls import path

from .views import (
    CanteenManagerOrderAcceptView,
    CanteenManagerOrderDetailView,
    CanteenManagerOrderListView,
    CanteenManagerOrderRejectView,
    CanteenManagerOrderStatusUpdateView,
    CanteenManagerVerifyPickupView,
    DeliveryAcceptOrderView,
    DeliveryAvailableOrdersView,
    DeliveryCompleteOrderView,
    DeliveryMyOrdersView,
    OrderCancelView,
    OrderDetailView,
    OrderListCreateView,
    OrderStatusView,
)

urlpatterns = [
    path("orders/", OrderListCreateView.as_view(), name="orders-list-create"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="orders-detail"),
    path("orders/<int:id>/cancel/", OrderCancelView.as_view(), name="orders-cancel"),
    path("orders/<int:id>/status/", OrderStatusView.as_view(), name="orders-status"),
    path("canteen-manager/orders/", CanteenManagerOrderListView.as_view(), name="canteen-manager-orders"),
    path("canteen-manager/orders/<int:id>/", CanteenManagerOrderDetailView.as_view(), name="canteen-manager-order-detail"),
    path(
        "canteen-manager/orders/<int:id>/accept/",
        CanteenManagerOrderAcceptView.as_view(),
        name="canteen-manager-order-accept",
    ),
    path(
        "canteen-manager/orders/<int:id>/reject/",
        CanteenManagerOrderRejectView.as_view(),
        name="canteen-manager-order-reject",
    ),
    path(
        "canteen-manager/orders/<int:id>/status/",
        CanteenManagerOrderStatusUpdateView.as_view(),
        name="canteen-manager-order-status-update",
    ),
    path(
        "canteen-manager/orders/<int:id>/verify-pickup/",
        CanteenManagerVerifyPickupView.as_view(),
        name="canteen-manager-order-verify-pickup",
    ),
    # Delivery person endpoints
    path("delivery/available/", DeliveryAvailableOrdersView.as_view(), name="delivery-available-orders"),
    path("delivery/orders/", DeliveryMyOrdersView.as_view(), name="delivery-my-orders"),
    path("delivery/orders/<int:id>/accept/", DeliveryAcceptOrderView.as_view(), name="delivery-accept-order"),
    path("delivery/orders/<int:id>/complete/", DeliveryCompleteOrderView.as_view(), name="delivery-complete-order"),
]
