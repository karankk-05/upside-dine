"""
Background task that polls camera feeds (read from Redis) and pushes crowd metrics back to Redis.
Feeds are managed by Django and synced to Redis key 'crowd:feeds:active'.
"""
import asyncio
import json
import logging
from datetime import datetime

import redis

from config import REDIS_URL, POLL_INTERVAL_SECONDS
from models.crowd_detector import detector
from services.video_processor import grab_frame

logger = logging.getLogger(__name__)

_polling_task: asyncio.Task | None = None

# Redis client (sync — runs in thread via asyncio.to_thread)
_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


def get_feeds_from_redis() -> list[dict]:
    """Read the active feed list that Django pushes to Redis."""
    r = _get_redis()
    raw = r.get("crowd:feeds:active")
    if not raw:
        return []
    return json.loads(raw)


def analyze_feed(feed_url: str, mess_id: int) -> dict | None:
    """Grab frame from feed, run YOLO, return metrics."""
    frame = grab_frame(feed_url)
    if frame is None:
        return None

    metrics = detector.detect(frame)
    metrics["mess_id"] = mess_id
    metrics["feed_url"] = feed_url
    metrics["timestamp"] = datetime.now().isoformat()
    return metrics


def push_to_redis(mess_id: int, metrics: dict):
    """Cache latest crowd metrics in Redis."""
    r = _get_redis()
    key = f"crowd:mess:{mess_id}"
    r.set(key, json.dumps(metrics), ex=120)  # TTL 2 minutes


async def _poll_loop():
    """Background loop: read feeds from Redis, analyze, push results."""
    logger.info(f"Starting crowd polling loop (interval={POLL_INTERVAL_SECONDS}s)")

    # Ensure model is loaded
    if not detector.is_loaded():
        await asyncio.to_thread(detector.load_model)
        logger.info("YOLOv8 model loaded")

    while True:
        feeds = await asyncio.to_thread(get_feeds_from_redis)

        if not feeds:
            logger.debug("No active feeds registered. Waiting...")
        else:
            for feed in feeds:
                if not feed.get("is_active", True):
                    continue
                try:
                    metrics = await asyncio.to_thread(
                        analyze_feed, feed["feed_url"], feed["mess_id"]
                    )
                    if metrics:
                        await asyncio.to_thread(push_to_redis, feed["mess_id"], metrics)
                        logger.info(
                            f"Mess {feed['mess_id']}: {metrics['person_count']} people "
                            f"({metrics['density_level']})"
                        )
                    else:
                        logger.warning(f"Failed to analyze feed {feed.get('id')} ({feed['feed_url']})")
                except Exception as e:
                    logger.error(f"Error polling feed {feed.get('id')}: {e}")

        await asyncio.sleep(POLL_INTERVAL_SECONDS)


def start_polling():
    """Start the background polling task."""
    global _polling_task
    if _polling_task is None or _polling_task.done():
        loop = asyncio.get_event_loop()
        _polling_task = loop.create_task(_poll_loop())
        logger.info("Polling task started")


def stop_polling():
    """Stop the background polling task."""
    global _polling_task
    if _polling_task and not _polling_task.done():
        _polling_task.cancel()
        _polling_task = None
        logger.info("Polling task stopped")
