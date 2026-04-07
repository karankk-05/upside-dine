from django.contrib import admin

from .models import CameraFeed, CrowdMetric


@admin.register(CameraFeed)
class CameraFeedAdmin(admin.ModelAdmin):
    list_display = ("mess_id", "camera_url", "is_active", "location_description", "created_at")
    list_filter = ("is_active", "mess_id")
    search_fields = ("location_description", "camera_url")


@admin.register(CrowdMetric)
class CrowdMetricAdmin(admin.ModelAdmin):
    list_display = ("mess_id", "estimated_count", "density_level", "density_percentage", "estimated_wait_minutes", "recorded_at")
    list_filter = ("density_level", "mess_id")
    ordering = ("-recorded_at",)
