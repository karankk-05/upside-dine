"""
Celery tasks for storing hourly crowd aggregates from Redis into the database.
"""
import json
import logging

from celery import shared_task
from django.core.cache import cache
from django.utils import timezone

from .models import CrowdMetric, CameraFeed

logger = logging.getLogger(__name__)


@shared_task
def store_crowd_snapshot():
    """
    Periodic task (run every 5-10 min via celery beat).
    Reads latest crowd data from Redis and stores it in CrowdMetric for historical tracking.
    """
    feed_ids = CameraFeed.objects.filter(is_active=True).values_list("mess_id", flat=True).distinct()

    for mess_id in feed_ids:
        cached = cache.get(f"crowd:mess:{mess_id}")
        if not cached:
            continue

        if isinstance(cached, str):
            data = json.loads(cached)
        else:
            data = cached

        CrowdMetric.objects.create(
            mess_id=mess_id,
            density_percentage=data.get("density_percentage", 0),
            estimated_count=data.get("person_count", 0),
            density_level=data.get("density_level", "low"),
            estimated_wait_minutes=data.get("estimated_wait_minutes", 0),
        )
        logger.info(f"Stored crowd snapshot for mess {mess_id}: {data.get('person_count', 0)} people")
