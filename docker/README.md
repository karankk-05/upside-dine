# Infrastructure -- Docker Compose + Nginx

This document covers the containerized deployment infrastructure for UpsideDine: a **9-container Docker Compose** stack with an **Nginx reverse proxy** handling all traffic routing.

---

## Architecture Overview

All services run as Docker containers orchestrated by a single `docker-compose.yml` at the repository root. Nginx acts as the single entry point on port `48080`, routing requests to the appropriate internal service.

```
External Traffic (:48080)
    |
    v
  Nginx (:80)
    |-- /           -->  React Frontend (:3000)
    |-- /api/       -->  Django REST API (:8000)
    |-- /admin/     -->  Django Admin (:8000)
    |-- /ws/        -->  Daphne WebSocket (:8001)
    |-- /static/    -->  Static Volume
    |-- /media/     -->  Media Volume
```

---

## Container Inventory

| # | Service | Image / Build | Port | Description |
|---|---|---|---|---|
| 1 | `db` | `postgres:14-alpine` | 5432 (internal) | Primary relational database |
| 2 | `redis` | `redis:7-alpine` | 6379 (internal) | Cache, message broker, pub/sub |
| 3 | `backend` | `./backend/Dockerfile` | 8000 (internal) | Django REST API server |
| 4 | `celery_worker` | `./backend/Dockerfile` | -- | Async task processing |
| 5 | `celery_beat` | `./backend/Dockerfile` | -- | Scheduled task scheduler |
| 6 | `channels` | `./backend/Dockerfile` | 8001 (internal) | Daphne ASGI / WebSocket server |
| 7 | `ml_service` | `./ml_service/Dockerfile` | 8002 (internal) | FastAPI + YOLOv8 crowd detection |
| 8 | `frontend` | `./frontend/Dockerfile` | 3000 (internal) | Vite React dev server |
| 9 | `nginx` | `nginx:alpine` | **48080 (exposed)** | Reverse proxy, static files |
| -- | `adminer` | `adminer` | 9090 (localhost only) | Database admin UI |

Only **port 48080** (Nginx) and **port 9090** (Adminer, localhost-only) are exposed to the host.

---

## Service Details

### PostgreSQL (`db`)

- **Image**: `postgres:14-alpine`
- **Database**: `upside_dine_db`
- **Health check**: `pg_isready -U postgres` every 10s
- **Volume**: `postgres_data` (persistent across restarts)

### Redis (`redis`)

- **Image**: `redis:7-alpine`
- **Health check**: `redis-cli ping` every 10s
- **Usage**: 3 logical databases:
  - DB 0: Django cache + ML service crowd data
  - DB 1: Celery broker
  - DB 2: Celery result backend

### Django Backend (`backend`)

- **Build**: `python:3.10-slim` with PostgreSQL client, build tools
- **Startup command**: Runs migrations, seeds data, collects static files, then starts `runserver`
- **Health check**: `curl http://localhost:8000/api/health/` every 30s
- **Depends on**: `db` (healthy), `redis` (healthy)
- **Volumes**: Source code mounted for live reload, shared static/media volumes

### Celery Worker (`celery_worker`)

- **Same image** as backend
- **Command**: `celery -A config worker -l info`
- **Purpose**: Processes async tasks (OTP emails, payment webhooks, feed sync)

### Celery Beat (`celery_beat`)

- **Same image** as backend
- **Command**: `celery -A config beat -l info`
- **Purpose**: Triggers scheduled tasks (booking expiry, inventory resets)

### Daphne / Channels (`channels`)

- **Same image** as backend
- **Command**: `daphne -b 0.0.0.0 -p 8001 config.asgi:application`
- **Purpose**: ASGI server for Django Channels WebSocket connections

### ML Service (`ml_service`)

- **Build**: `python:3.10-slim` with OpenCV system dependencies
- **Command**: `uvicorn main:app --host 0.0.0.0 --port 8002 --reload`
- **Health check**: `curl http://localhost:8002/ml/health` every 30s
- **Environment**: Redis URL, poll interval configured via env vars

### React Frontend (`frontend`)

- **Build**: `node:18-alpine`
- **Command**: `npm run dev` (Vite dev server with HMR)
- **Volumes**: Source code mounted, `node_modules` excluded via anonymous volume

### Nginx (`nginx`)

- **Image**: `nginx:alpine`
- **Exposed port**: `48080:80`
- **Config**: Mounted from `nginx/nginx.conf`
- **Volumes**: Shared static and media volumes from Django

---

## Nginx Configuration

The Nginx config (`nginx/nginx.conf`) defines upstream servers and routing rules:

### Upstreams
```nginx
upstream backend   { server backend:8000; }
upstream frontend  { server frontend:3000; }
upstream channels  { server channels:8001; }
```

### Routing Rules

| Location | Target | Notes |
|---|---|---|
| `/` | `frontend` | WebSocket upgrade support for Vite HMR |
| `/api/` | `backend` | REST API requests |
| `/admin/` | `backend` | Django admin panel |
| `/ws/` | `channels` | WebSocket upgrade with `Connection: upgrade` |
| `/static/` | `/static/` volume | 30-day cache, `immutable` header |
| `/media/` | `/media/` volume | 7-day cache |

### Key Settings
- `client_max_body_size 100M` -- allows large image uploads for crowd analysis
- WebSocket support via `$http_upgrade` / `$connection_upgrade` mapping

---

## Volumes

| Volume | Used By | Purpose |
|---|---|---|
| `postgres_data` | `db` | Persistent database storage |
| `static_volume` | `backend`, `nginx` | Django collected static files |
| `media_volume` | `backend`, `nginx` | User-uploaded media (QR codes, images) |

---

## Deployment (IITK Server)

The production deployment runs on an IIT Kanpur server:

1. **Docker Compose** brings up all 9 containers
2. **Ngrok** creates a tunnel to expose port 48080 to the public internet
3. Public URL: `cushy-chanda-unmaltable.ngrok-free.dev`

This setup bypasses the campus firewall which blocks outgoing database connections, since all services (including the database) run on the same server within the Docker network.

---

## Common Operations

### Start all services
```bash
docker compose up --build -d
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f ml_service
```

### Rebuild a single service
```bash
docker compose up --build -d backend
```

### Access the database
```bash
# Via Adminer (browser)
open http://localhost:9090
# Server: db, Username: postgres, Password: postgres, Database: upside_dine_db

# Via psql
docker compose exec db psql -U postgres -d upside_dine_db
```

### Run Django management commands
```bash
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py shell
```

### Full reset (destroy all data)
```bash
docker compose down -v
docker compose up --build -d
```

---

## Environment Files

Each service reads its environment from a `.env` file:

| File | Service | Template |
|---|---|---|
| `backend/.env` | backend, celery_worker, celery_beat, channels | `backend/.env.example` |
| `frontend/.env` | frontend | `frontend/.env.example` |

The `ml_service` environment is configured inline in `docker-compose.yml`.

---

## Health Checks

The following services have configured health checks with automatic restart on failure:

| Service | Endpoint | Interval |
|---|---|---|
| `db` | `pg_isready -U postgres` | 10s |
| `redis` | `redis-cli ping` | 10s |
| `backend` | `GET /api/health/` | 30s |
| `ml_service` | `GET /ml/health` | 30s |
