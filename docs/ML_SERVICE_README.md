# ML Crowd Monitoring Service

Real-time crowd density detection for mess/canteen areas using YOLOv8 person detection.

## Architecture

```
📱 Phone / 📹 CCTV Camera  →  🖥️ FastAPI (YOLOv8)  →  ⚡ Redis  →  🌐 Django API
```

The FastAPI service runs a background polling loop. Every 30 seconds, it fetches the list of active camera feeds directly from Redis (pushed by Django). It then grabs a single frame from each feed, runs YOLOv8 to count the number of people, processes the density level, and caches the result back in Redis.

The Django backend serves this data instantly to the frontend by reading the Redis cache.

### Key Integration Points
1. **Source of Truth**: Django's PostgreSQL database is the single source of truth for Camera Feeds.
2. **Auto-Sync**: Whenever the Django app boots, or a SuperAdmin/Manager adds/updates/deletes a `CameraFeed` via the Django Admin or API, a Django signal automatically publishes the updated list of feeds to the `crowd:feeds:active` key in Redis.
3. **Decoupled Async Processing**: The FastAPI service never directly talks to Postgres or Django. It strictly reads `crowd:feeds:active`, processes the video streams, and writes the metrics back to keys like `crowd:mess:<id>`.

---

## Quick Start

### 1. Requirements
When using Docker, the `ml_service` is built automatically and orchestrated via `docker-compose.yml`. The YOLOv8 weights (~6MB) will auto-download on the first run.

If running manually:
```bash
cd ml_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

### 2. Registering a Camera Feed
Because feed management is protected by strict Role-Based Access Control (RBAC), you **cannot** register a feed directly with the ML service. 

To add a new camera:
1. Log in to the Django Swagger UI (`/api/docs/`) with a SuperAdmin, Mess Manager, or Canteen Manager account to acquire a JWT.
2. Authorize Swagger with your token.
3. Use the `POST /api/crowd/feeds/` endpoint, providing the `mess_id` and the `camera_url`.
4. The moment the feed is added, Django pushes the update to Redis, and the FastAPI polling task will pick it up on its next 30-second cycle.

Alternatively, register feeds via the Django Admin panel: `http://localhost:8000/admin/crowd/camerafeed/add/`.

---

## Adapting for Real CCTV Feeds

Currently during development, an IP Webcam Android app generating an HTTP MJPEG stream (e.g. `http://192.168.1.x:8080/video`) is commonly used. 

When transitioning to production CCTV cameras, here is how to seamlessly adapt the system:

### 1. Identify the RTSP Stream URL
Modern CCTV IP cameras (Hikvision, Dahua, CP Plus, etc.) expose an RTSP stream. You must obtain the correct URL format from the equipment manual or network administrator. 
Common formats look like:
- `rtsp://admin:password@10.0.0.50:554/cam/realmonitor?channel=1&subtype=0`
- `rtsp://10.0.0.50:554/Streaming/Channels/101`

### 2. Enter the RTSP URL into Django
No code changes are required! The `cv2.VideoCapture()` pipeline in the `video_processor.py` natively supports RTSP URLs. 
Simply register the RTSP URL as the `camera_url` when creating a `CameraFeed` record in Django.

### 3. Handle Network Configurations
For the Dockerized ML Service to reach the CCTV cameras:
1. Ensure the Docker deployment and the CCTV cameras are on the same local network, or that the relevant ports (usually 554 for RTSP) are correctly forwarded and reachable.
2. If the CCTV feed requires high network throughput, consider placing the `ml_service` container on the same hardware network switch.

### 4. Optimize YOLO Parameters
CCTV cameras often have extremely wide-angle, high-resolution fish-eye lenses, looking down from the ceiling.
- You might need to adjust the `WAIT_TIME_PER_PERSON` dynamically based on the total floor area visible.
- Ensure the `YOLO_CONFIDENCE` threshold (default `0.4`) is tuned. If the CCTV is too far up, small people might not pass a high threshold.

---

## API Endpoints Reference

### Django Endpoints (Backend - port 8000)
| Endpoint | Method | RBAC | Description |
|----------|--------|------|-------------|
| `/api/crowd/feeds/` | GET | Auth | List all registered feeds |
| `/api/crowd/feeds/` | POST | Managers | Add a new camera feed |
| `/api/crowd/test-image/` | POST | Auth | Upload a test image; proxies directly to YOLOv8 for instant analysis |
| `/api/crowd/mess/{id}/live/` | GET | Public* | Read latest crowd density from Redis cache |

### FastAPI Endpoints (ML Service - port 8002)
*(Note: Do not call these directly from the frontend. Let Django proxy or read Redis).*
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ml/health` | GET | Health check; model loaded and active feed status. |
| `/ml/crowd/analyze` | POST | Internal: Analyze an uploaded image frame. |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection |
| `YOLO_MODEL` | `yolov8n.pt` | YOLOv8 model variant |
| `YOLO_CONFIDENCE` | `0.4` | Detection confidence threshold |
| `POLL_INTERVAL_SECONDS` | `30` | How often to poll feeds |
| `WAIT_TIME_PER_PERSON` | `0.3` | Minutes per person for wait estimate |
