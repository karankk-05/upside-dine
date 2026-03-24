from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
import json


class CameraFeed(models.Model):
    """Registered camera feed for a mess location."""
    mess_id = models.IntegerField(help_text="Mess ID (FK to mess app once available)")
    camera_url = models.URLField(max_length=500, help_text="RTSP or HTTP stream URL")
    is_active = models.BooleanField(default=True)
    location_description = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Camera Feed"
        verbose_name_plural = "Camera Feeds"

    def __str__(self):
        return f"Mess {self.mess_id} - {self.location_description or self.camera_url}"


@receiver([post_save, post_delete], sender=CameraFeed)
def sync_camera_feeds_to_redis(sender, **kwargs):
    """Automatically sync active camera feeds to Redis whenever a feed is created/updated/deleted
    so the FastAPI ML service picks up the changes."""
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


class CrowdMetric(models.Model):
    """Historical crowd density readings."""
    DENSITY_CHOICES = [
        ("low", "Low"),
        ("moderate", "Moderate"),
        ("high", "High"),
    ]

    mess_id = models.IntegerField(help_text="Mess ID")
    density_percentage = models.FloatField()
    estimated_count = models.IntegerField()
    density_level = models.CharField(max_length=20, choices=DENSITY_CHOICES)
    estimated_wait_minutes = models.FloatField(default=0)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Crowd Metric"
        verbose_name_plural = "Crowd Metrics"
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["mess_id", "-recorded_at"]),
        ]

    def __str__(self):
        return f"Mess {self.mess_id} - {self.density_level} ({self.estimated_count} people) @ {self.recorded_at}"
