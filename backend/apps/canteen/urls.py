from django.urls import path

from .views import (
    CanteenDetailView,
    CanteenListView,
    CanteenManagerCategoryListCreateView,
    CanteenManagerMenuDetailView,
    CanteenManagerMenuListCreateView,
    CanteenManagerStatsView,
    CanteenMenuView,
    CanteenCategoryListView,
    CanteenSearchView,
)

urlpatterns = [
    path("canteens/", CanteenListView.as_view(), name="canteens-list"),
    path("canteens/<int:pk>/", CanteenDetailView.as_view(), name="canteens-detail"),
    path("canteens/<int:id>/menu/", CanteenMenuView.as_view(), name="canteens-menu"),
    path("canteens/<int:id>/categories/", CanteenCategoryListView.as_view(), name="canteens-categories"),
    path("canteens/search/", CanteenSearchView.as_view(), name="canteens-search"),
    path("canteen-manager/menu/", CanteenManagerMenuListCreateView.as_view(), name="canteen-manager-menu"),
    path(
        "canteen-manager/menu/<int:pk>/",
        CanteenManagerMenuDetailView.as_view(),
        name="canteen-manager-menu-detail",
    ),
    path(
        "canteen-manager/categories/",
        CanteenManagerCategoryListCreateView.as_view(),
        name="canteen-manager-categories",
    ),
    path("canteen-manager/stats/", CanteenManagerStatsView.as_view(), name="canteen-manager-stats"),
]
