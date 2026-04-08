from rest_framework import serializers

from .models import CameraFeed, CrowdMetric


class CameraFeedSerializer(serializers.ModelSerializer):
    mess_name = serializers.SerializerMethodField()
    feed_number = serializers.SerializerMethodField()

    def get_mess_name(self, obj):
        from apps.mess.models import Mess
        try:
            return Mess.objects.get(pk=obj.mess_id).name
        except Mess.DoesNotExist:
            return f"Mess {obj.mess_id}"

    def get_feed_number(self, obj):
        feed_number_map = self.context.get("feed_number_map") or {}
        if obj.id in feed_number_map:
            return feed_number_map[obj.id]

        ordered_feed_ids = list(
            CameraFeed.objects.filter(mess_id=obj.mess_id)
            .order_by("created_at", "id")
            .values_list("id", flat=True)
        )
        try:
            return ordered_feed_ids.index(obj.id) + 1
        except ValueError:
            return None

    class Meta:
        model = CameraFeed
        fields = [
            "id",
            "feed_number",
            "mess_id",
            "mess_name",
            "camera_url",
            "is_active",
            "location_description",
            "created_at",
        ]
        read_only_fields = ["id", "feed_number", "created_at"]


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
