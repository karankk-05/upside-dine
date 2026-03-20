# ML Crowd Monitoring Service

Real-time crowd density detection for mess/canteen areas using YOLOv8 person detection.

## Architecture

```
📱 Phone (IP Webcam)  →  🖥️ FastAPI (YOLOv8)  →  ⚡ Redis  →  🌐 Django API
```

The FastAPI service grabs frames from camera feeds every 30 seconds, runs YOLOv8 to count people, and caches the result in Redis. The Django backend reads from Redis to serve crowd data to the frontend.

## Quick Start

### 1. Install Dependencies

```bash
cd ml_service
pip install -r requirements.txt
```

> YOLOv8 weights (~6MB) auto-download on first run. No manual setup needed.

### 2. Start Redis

```bash
# If using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or if Redis is already running via docker-compose
docker compose up redis -d
```

### 3. Run the Service

```bash
cd ml_service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

API docs available at: `http://localhost:8001/docs`

### 4. Set Up Phone as Camera

1. Install **IP Webcam** (Android) from Play Store
2. Connect phone and laptop to the **same WiFi network**
3. Open IP Webcam → scroll down → **Start Server**
4. Note the URL shown (e.g., `http://192.168.1.5:8080`)
5. Your video feed is at: `http://192.168.1.5:8080/video`

### 5. Register the Feed

```bash
curl -X POST http://localhost:8001/ml/crowd/feeds \
  -H "Content-Type: application/json" \
  -d '{"mess_id": 1, "feed_url": "http://192.168.1.5:8080/video", "description": "Hall 1 Mess"}'
```

The service will now poll this feed every 30 seconds and push results to Redis.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ml/health` | GET | Health check (model loaded, active feeds) |
| `/ml/crowd/analyze` | POST | Upload image → get crowd count (one-shot) |
| `/ml/crowd/feeds` | GET | List registered camera feeds |
| `/ml/crowd/feeds` | POST | Register a new feed URL |
| `/ml/crowd/feeds/{id}` | DELETE | Remove a feed |
| `/ml/crowd/feeds/{id}/snapshot` | GET | Latest frame as JPEG |
| `/ml/crowd/feeds/{id}/analyze` | GET | Analyze feed right now (bypass timer) |

## Django Endpoints (Backend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/crowd/mess/{id}/live/` | GET | Current density from Redis |
| `/api/crowd/mess/{id}/history/` | GET | Today's hourly readings |
| `/api/crowd/mess/{id}/recommendation/` | GET | Best times to visit (7-day avg) |

## Camera Feed Options

| Source | URL Format | Notes |
|--------|-----------|-------|
| IP Webcam (Android) | `http://<phone-ip>:8080/video` | Best for demos |
| EpocCam (iOS) | Varies by app | Check app settings |
| Laptop webcam | `0` | Local testing only |
| RTSP camera | `rtsp://<ip>:<port>/stream` | Real CCTV |
| Video file | `/path/to/video.mp4` | Consistent demo |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection |
| `YOLO_MODEL` | `yolov8n.pt` | YOLOv8 model variant |
| `YOLO_CONFIDENCE` | `0.4` | Detection confidence threshold |
| `POLL_INTERVAL_SECONDS` | `30` | How often to poll feeds |
| `WAIT_TIME_PER_PERSON` | `0.3` | Minutes per person for wait estimate |

## File Structure

```
ml_service/
├── main.py                      # FastAPI app + endpoints
├── config.py                    # Settings (Redis, YOLO, thresholds)
├── schemas.py                   # Pydantic request/response models
├── requirements.txt
├── Dockerfile
├── models/
│   └── crowd_detector.py        # YOLOv8 wrapper
└── services/
    ├── video_processor.py       # Frame grabbing (OpenCV)
    └── crowd_analyzer.py        # Background polling + Redis push
```
