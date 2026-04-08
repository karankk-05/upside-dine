import json
from datetime import datetime, timedelta

from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from drf_spectacular.utils import extend_schema, OpenApiTypes

from .models import CameraFeed, CrowdMetric
from .serializers import CameraFeedSerializer, CrowdMetricSerializer, LiveCrowdSerializer
from apps.users.permissions import IsSuperAdmin, IsMessManager, IsCanteenManager


class FeedManagePermission(IsAuthenticated):
    """Only superadmin, mess managers, and canteen managers can manage feeds."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        user = request.user
        if user.is_superuser:
            return True
        if user.role and user.role.role_name in ["mess_manager", "canteen_manager"]:
            return True
        return False


def _sync_feeds_to_redis():
    """Push all active camera feeds to Redis so FastAPI can read them."""
    import redis
    from django.conf import settings
    # Extract raw REDIS_URL from settings without django-redis wrapper
    redis_url = settings.CACHES["default"]["LOCATION"]
    r = redis.from_url(redis_url)

    feeds = list(
        CameraFeed.objects.filter(is_active=True).values(
            "id", "mess_id", "camera_url", "location_description"
        )
    )
    feed_list = [
        {
            "id": f["id"],
            "mess_id": f["mess_id"],
            "feed_url": f["camera_url"],
            "description": f["location_description"],
            "is_active": True,
        }
        for f in feeds
    ]
    r.set("crowd:feeds:active", json.dumps(feed_list))


class CameraFeedListCreateView(ListCreateAPIView):
    """List all camera feeds or register a new one.
    Only superadmin, mess managers, and canteen managers can access."""
    permission_classes = [FeedManagePermission]
    serializer_class = CameraFeedSerializer
    queryset = CameraFeed.objects.order_by("mess_id", "created_at", "id")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        feeds = list(self.get_queryset())
        feed_number_map = {}
        counts_by_mess = {}

        for feed in feeds:
            counts_by_mess[feed.mess_id] = counts_by_mess.get(feed.mess_id, 0) + 1
            feed_number_map[feed.id] = counts_by_mess[feed.mess_id]

        context["feed_number_map"] = feed_number_map
        return context

    def perform_create(self, serializer):
        serializer.save()
        _sync_feeds_to_redis()


class CameraFeedDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a camera feed.
    Only superadmin, mess managers, and canteen managers can access."""
    permission_classes = [FeedManagePermission]
    serializer_class = CameraFeedSerializer
    queryset = CameraFeed.objects.order_by("mess_id", "created_at", "id")

    def perform_update(self, serializer):
        serializer.save()
        _sync_feeds_to_redis()

    def perform_destroy(self, instance):
        instance.delete()
        _sync_feeds_to_redis()


class LiveCrowdView(GenericAPIView):
    """Get current crowd density for a mess (from Redis cache)."""
    permission_classes = [IsAuthenticated]
    serializer_class = LiveCrowdSerializer

    @extend_schema(responses=LiveCrowdSerializer)
    def get(self, request, mess_id):
        import redis
        from django.conf import settings
        
        # Extract raw REDIS_URL from settings without django-redis wrapper
        redis_url = settings.CACHES["default"]["LOCATION"]
        r = redis.from_url(redis_url)
        
        cached = r.get(f"crowd:mess:{mess_id}")
        if not cached:
            return Response(
                {"detail": "No live data available for this mess."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if isinstance(cached, str):
            data = json.loads(cached)
        elif isinstance(cached, bytes):
            data = json.loads(cached.decode('utf-8'))
        else:
            data = cached

        return Response(LiveCrowdSerializer(data).data)


class CrowdHistoryView(GenericAPIView):
    """Get hourly crowd history for a mess for today."""
    permission_classes = [IsAuthenticated]
    serializer_class = CrowdMetricSerializer

    def get(self, request, mess_id):
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        metrics = CrowdMetric.objects.filter(
            mess_id=mess_id,
            recorded_at__gte=today_start,
        ).order_by("recorded_at")

        serializer = self.get_serializer(metrics, many=True)
        return Response(serializer.data)


class CrowdRecommendationView(GenericAPIView):
    """Recommend the best time to visit based on historical data."""
    permission_classes = [IsAuthenticated]
    serializer_class = CrowdMetricSerializer

    def get(self, request, mess_id):
        # Look at last 7 days of data for this mess
        week_ago = timezone.now() - timedelta(days=7)
        metrics = CrowdMetric.objects.filter(
            mess_id=mess_id,
            recorded_at__gte=week_ago,
        ).order_by("recorded_at")

        if not metrics.exists():
            return Response(
                {"detail": "Not enough data for recommendations.", "best_times": []},
            )

        # Group by hour and find the lowest average density
        hourly = {}
        for m in metrics:
            hour = m.recorded_at.hour
            if hour not in hourly:
                hourly[hour] = []
            hourly[hour].append(m.estimated_count)

        hourly_avg = {
            hour: sum(counts) / len(counts)
            for hour, counts in hourly.items()
        }

        # Sort by average count, recommend top 3 least crowded hours
        best_hours = sorted(hourly_avg.items(), key=lambda x: x[1])[:3]
        best_times = [
            {
                "hour": h,
                "time_range": f"{h}:00 - {h+1}:00",
                "avg_people": round(avg, 1),
            }
            for h, avg in best_hours
        ]

        return Response({
            "mess_id": mess_id,
            "recommendation": "Visit during these less crowded hours",
            "best_times": best_times,
        })


class CrowdAnalyzeImageView(GenericAPIView):
    """
    Test endpoint: Upload an image to analyze the crowd instantly.
    Proxies the image to the FastAPI ML service.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "file": {
                        "type": "string",
                        "format": "binary",
                    }
                },
                "required": ["file"],
            }
        },
        responses={200: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        if "file" not in request.FILES:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_obj = request.FILES["file"]
        
        import requests
        from django.conf import settings
        
        ml_url = getattr(settings, "ML_SERVICE_URL", "http://ml_service:8002")
        analyze_url = f"{ml_url}/ml/crowd/analyze"
        
        try:
            # Send file to FastAPI
            files = {"file": (file_obj.name, file_obj.read(), file_obj.content_type)}
            response = requests.post(analyze_url, files=files, timeout=15)
            
            if response.status_code == 200:
                return Response(response.json())
            else:
                return Response(
                    {"detail": f"ML Service error: {response.text}"},
                    status=response.status_code,
                )
        except requests.exceptions.RequestException as e:
            return Response(
                {"detail": f"Could not connect to ML service: {e}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
