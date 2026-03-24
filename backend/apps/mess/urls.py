from django.urls import path

from .views import (
    ManagerBookingListView,
    ManagerInventoryView,
    ManagerMenuDetailView,
    ManagerMenuListCreateView,
    ManagerStatsView,
    StudentBookingCancelView,
    StudentBookingDetailView,
    StudentBookingQRCodeView,
    StudentBookingListView,
    StudentExtrasBookingCreateView,
    StudentMessListView,
    StudentMessMenuListView,
    WorkerScanHistoryView,
    WorkerVerifyBookingView,
)

app_name = "mess"

urlpatterns = [
    path("", StudentMessListView.as_view(), name="mess-list"),
    path("<int:mess_id>/menu/", StudentMessMenuListView.as_view(), name="mess-menu-list"),
    path("extras/book/", StudentExtrasBookingCreateView.as_view(), name="extras-book"),
    path("bookings/", StudentBookingListView.as_view(), name="booking-list"),
    path("bookings/<int:booking_id>/", StudentBookingDetailView.as_view(), name="booking-detail"),
    path("bookings/<int:booking_id>/qr-image/", StudentBookingQRCodeView.as_view(), name="booking-qr-image"),
    path("bookings/<int:booking_id>/cancel/", StudentBookingCancelView.as_view(), name="booking-cancel"),
    path("manager/menu/", ManagerMenuListCreateView.as_view(), name="manager-menu-list-create"),
    path("manager/menu/<int:menu_item_id>/", ManagerMenuDetailView.as_view(), name="manager-menu-detail"),
    path("manager/bookings/", ManagerBookingListView.as_view(), name="manager-bookings"),
    path("manager/stats/", ManagerStatsView.as_view(), name="manager-stats"),
    path("manager/inventory/", ManagerInventoryView.as_view(), name="manager-inventory"),
    path("worker/verify/", WorkerVerifyBookingView.as_view(), name="worker-verify"),
    path("worker/scan-history/", WorkerScanHistoryView.as_view(), name="worker-scan-history"),
]
