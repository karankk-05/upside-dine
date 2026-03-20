"""
Upside Dine — ML Crowd Monitoring Service (FastAPI)

Feeds are managed by Django (with role-based permissions).
This service reads feed URLs from Redis, runs YOLOv8, and pushes results back.
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
import numpy as np
import cv2

from schemas import HealthResponse, CrowdResult
from models.crowd_detector import detector
from services.crowd_analyzer import (
    get_feeds_from_redis,
    analyze_feed,
    start_polling,
    stop_polling,
)
from services.video_processor import grab_frame_as_jpeg

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load YOLO model on startup, start polling."""
    logger.info("Loading YOLOv8 model...")
    detector.load_model()
    logger.info("Model loaded successfully")
    start_polling()
    yield
    stop_polling()


app = FastAPI(
    title="Upside Dine ML Service",
    description="Crowd monitoring via YOLOv8 person detection. Feeds are managed via Django API.",
    version="1.0.0",
    lifespan=lifespan,
)


# ─── Health ───────────────────────────────────────────────────────────────────


@app.get("/ml/health", response_model=HealthResponse)
def health_check():
    """Service health check."""
    feeds = get_feeds_from_redis()
    return HealthResponse(
        status="ok",
        model_loaded=detector.is_loaded(),
        active_feeds=len(feeds),
    )


# ─── One-Shot Analysis ────────────────────────────────────────────────────────


@app.post("/ml/crowd/analyze", response_model=CrowdResult)
async def analyze_image(
    file: UploadFile = File(...),
    mess_id: int = 1,
):
    """
    Upload an image and get crowd count + density.
    Useful for testing without a live feed.
    """
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    metrics = detector.detect(frame)

    return CrowdResult(
        mess_id=mess_id,
        person_count=metrics["person_count"],
        density_percentage=metrics["density_percentage"],
        density_level=metrics["density_level"],
        estimated_wait_minutes=metrics["estimated_wait_minutes"],
        timestamp=datetime.now().isoformat(),
    )


# ─── Feed Info (Read-Only) ────────────────────────────────────────────────────


@app.get("/ml/crowd/feeds")
def list_feeds():
    """List active feeds (read from Redis, managed by Django)."""
    return get_feeds_from_redis()


@app.get("/ml/crowd/feeds/{feed_id}/snapshot")
def get_snapshot(feed_id: int):
    """Get the latest frame from a feed as a JPEG image."""
    feeds = {f["id"]: f for f in get_feeds_from_redis()}
    if feed_id not in feeds:
        raise HTTPException(status_code=404, detail="Feed not found")

    jpeg_bytes = grab_frame_as_jpeg(feeds[feed_id]["feed_url"])
    if jpeg_bytes is None:
        raise HTTPException(status_code=503, detail="Could not grab frame from feed")

    return Response(content=jpeg_bytes, media_type="image/jpeg")


@app.get("/ml/crowd/feeds/{feed_id}/analyze", response_model=CrowdResult)
def analyze_feed_now(feed_id: int):
    """Grab a frame from the feed right now and analyze it (bypass polling interval)."""
    feeds = {f["id"]: f for f in get_feeds_from_redis()}
    if feed_id not in feeds:
        raise HTTPException(status_code=404, detail="Feed not found")

    feed = feeds[feed_id]
    metrics = analyze_feed(feed["feed_url"], feed["mess_id"])
    if metrics is None:
        raise HTTPException(status_code=503, detail="Could not analyze feed")

    return CrowdResult(
        mess_id=metrics["mess_id"],
        person_count=metrics["person_count"],
        density_percentage=metrics["density_percentage"],
        density_level=metrics["density_level"],
        estimated_wait_minutes=metrics["estimated_wait_minutes"],
        timestamp=metrics["timestamp"],
        feed_url=metrics["feed_url"],
    )
