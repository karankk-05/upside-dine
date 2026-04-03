"""
ML Crowd Monitoring Service — Configuration
"""
import os


# Redis
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_URL = os.getenv("REDIS_URL", f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}")

# YOLO Model
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")  # auto-downloads on first run
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", 0.25))
PERSON_CLASS_ID = 0  # COCO class ID for 'person'

# Feed polling
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", 30))

# Crowd density thresholds
DENSITY_THRESHOLDS = {
    "low": 15,        # 0-15 people
    "moderate": 40,   # 16-40 people
    # above 40 = high
}

# Wait time estimation (minutes per person bucket)
WAIT_TIME_PER_PERSON = float(os.getenv("WAIT_TIME_PER_PERSON", 0.3))
