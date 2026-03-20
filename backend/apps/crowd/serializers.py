from rest_framework import serializers

from .models import CameraFeed, CrowdMetric


class CameraFeedSerializer(serializers.ModelSerializer):
    class Meta:
        model = CameraFeed
        fields = ["id", "mess_id", "camera_url", "is_active", "location_description", "created_at"]
        read_only_fields = ["id", "created_at"]


class CrowdMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrowdMetric
        fields = ["id", "mess_id", "density_percentage", "estimated_count", "density_level", "estimated_wait_minutes", "recorded_at"]
        read_only_fields = fields


class LiveCrowdSerializer(serializers.Serializer):
    """For the Redis-cached live data."""
    mess_id = serializers.IntegerField()
    person_count = serializers.IntegerField()
    density_percentage = serializers.FloatField()
    density_level = serializers.CharField()
    estimated_wait_minutes = serializers.FloatField()
    timestamp = serializers.CharField()
    feed_url = serializers.CharField(required=False, allow_null=True)
