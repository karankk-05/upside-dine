# ML Service -- FastAPI + YOLOv8 Crowd Monitoring

A standalone **FastAPI** microservice that performs real-time crowd density estimation in mess halls using **YOLOv8 person detection**. It operates independently from the Django backend, communicating exclusively through **Redis** for both feed configuration and result delivery.

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | FastAPI 0.115 |
| Server | Uvicorn (ASGI) |
| ML Model | Ultralytics YOLOv8m (person detection) |
| Computer Vision | OpenCV (headless) |
| Data Store | Redis 5.0 |
| Image Processing | Pillow 10.4, NumPy 1.26 |

---

## How It Works

### Architecture

The ML service follows a **producer-consumer pattern** with Redis as the intermediary:

1. **Django** manages camera feeds (CRUD via the admin/manager UI) and syncs active feeds to Redis key `crowd:feeds:active`
2. **ML Service** reads the feed list from Redis on a configurable polling interval
3. For each active feed, the service grabs a frame from the camera URL (RTSP or HTTP)
4. **YOLOv8** runs person detection on the frame, counting the number of people visible
5. Density percentage and estimated wait time are calculated from the person count
6. Results are pushed back to Redis under `crowd:mess:<mess_id>` with a 2-minute TTL
7. The Django backend reads these cached results and pushes them to the frontend via WebSocket

### Density Calculation

```
density_percentage = min(100, (person_count / capacity) * 100)

density_level:
  - "low"       -> 0-30%
  - "moderate"  -> 30-60%
  - "high"      -> 60-80%
  - "very_high" -> 80%+

estimated_wait_minutes:
  Based on density level brackets (0-5, 5-12, 12-20, 20+ minutes)
```

### Feed Backoff

If a camera feed fails (offline, network error), the service applies a 60-second backoff before retrying that specific feed. This prevents wasting resources on dead streams while continuing to poll healthy feeds.

---

## API Endpoints

All endpoints are prefixed with `/ml/`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/ml/health` | Service health check (model loaded, active feed count) |
| `POST` | `/ml/crowd/analyze` | Upload an image for one-shot crowd analysis (testing) |
| `GET` | `/ml/crowd/feeds` | List active feeds (read from Redis) |
| `GET` | `/ml/crowd/feeds/{id}/snapshot` | Get latest JPEG frame from a feed |
| `GET` | `/ml/crowd/feeds/{id}/analyze` | Grab and analyze a feed frame on-demand |

### Example: One-Shot Analysis

```bash
curl -X POST http://localhost:8002/ml/crowd/analyze \
  -F "file=@mess_photo.jpg" \
  -F "mess_id=1"
```

Response:
```json
{
  "mess_id": 1,
  "person_count": 42,
  "density_percentage": 68.5,
  "density_level": "high",
  "estimated_wait_minutes": 15,
  "timestamp": "2026-01-24T13:30:00"
}
```

---

## Model Details

| Property | Value |
|---|---|
| Model | YOLOv8m (medium) |
| Task | Object Detection |
| Target Class | Person (COCO class 0) |
| Weights | `yolov8m.pt` (52 MB, pre-trained on COCO) |
| Fallback | `yolov8n.pt` (6.5 MB, nano variant for low-resource environments) |
| Inference | CPU by default, GPU (CUDA) if available |

The model filters detections to only the "person" class (class ID 0) and applies a confidence threshold to reduce false positives.

---

## Redis Keys

| Key | Set By | Read By | Description |
|---|---|---|---|
| `crowd:feeds:active` | Django (via signals) | ML Service | JSON array of active camera feeds |
| `crowd:mess:<id>` | ML Service | Django | Latest crowd metrics for a mess (TTL: 120s) |

---

## Configuration

Environment variables (set in `docker-compose.yml`):

| Variable | Description | Default |
|---|---|---|
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `POLL_INTERVAL_SECONDS` | Seconds between polling cycles | `30` |

---

## Local Development

```bash
cd ml_service

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Ensure Redis is running locally
# Edit config.py if needed for local Redis URL

# Start the service
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

The interactive API docs are available at `http://localhost:8002/docs`.

---

## Directory Structure

```
ml_service/
|-- models/
|   |-- crowd_detector.py     # YOLOv8 wrapper (load, detect, metrics)
|-- services/
|   |-- crowd_analyzer.py     # Polling loop, Redis read/write, feed analysis
|   |-- video_processor.py    # Frame grabbing from camera URLs
|-- main.py                   # FastAPI app, routes, lifespan
|-- schemas.py                # Pydantic models (HealthResponse, CrowdResult)
|-- config.py                 # Environment configuration
|-- requirements.txt
|-- Dockerfile
|-- yolov8m.pt                # Primary model weights
|-- yolov8n.pt                # Fallback nano model weights
`-- test_yolo.py              # Basic detection test script
```
