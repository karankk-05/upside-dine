from django.urls import path

from .views import (
    CameraFeedListCreateView,
    CameraFeedDeleteView,
    LiveCrowdView,
    CrowdHistoryView,
    CrowdRecommendationView,
    CrowdAnalyzeImageView,
)

urlpatterns = [
    # Feed management (superadmin, mess_manager, canteen_manager only)
    path("crowd/feeds/", CameraFeedListCreateView.as_view(), name="crowd-feeds-list"),
    path("crowd/feeds/<int:pk>/", CameraFeedDeleteView.as_view(), name="crowd-feeds-delete"),

    # Crowd data (any authenticated user)
    path("crowd/mess/<int:mess_id>/live/", LiveCrowdView.as_view(), name="crowd-live"),
    path("crowd/mess/<int:mess_id>/history/", CrowdHistoryView.as_view(), name="crowd-history"),
    path("crowd/mess/<int:mess_id>/recommendation/", CrowdRecommendationView.as_view(), name="crowd-recommendation"),
    
    # Testing endpoints
    path("crowd/test-image/", CrowdAnalyzeImageView.as_view(), name="crowd-test-image"),
]
