# Backend -- Django REST API

The backend is built on **Django 5.0** with **Django REST Framework**, serving as the central API layer for all platform operations. It handles authentication, role-based access control, mess and canteen management, order processing, payments, and crowd monitoring data.

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Django 5.0, Django REST Framework 3.14 |
| Database | PostgreSQL 14 |
| Cache / Broker | Redis 7 |
| Auth | SimpleJWT (JWT tokens), OTP-based email verification |
| WebSocket | Django Channels 4.0, Daphne 4.1 (ASGI) |
| Task Queue | Celery 5.3, Celery Beat |
| Payments | Razorpay SDK (webhooks, UPI, cards, refunds) |
| Email | Brevo SMTP (via django-anymail) |
| API Docs | drf-spectacular (OpenAPI 3.0, Swagger, ReDoc) |
| Monitoring | Sentry SDK |

---

## Django Apps

The backend is organized into 6 feature-scoped Django apps under `apps/`:

### `apps/users`

User management with a custom `AbstractBaseUser` model and a 6-role RBAC system.

- **Models**: `User`, `Role`, `Student`, `EmployeeCode`
- **Roles**: `student`, `mess_manager`, `mess_worker`, `canteen_manager`, `delivery_person`, `admin_manager`
- **Auth flow**: Students self-register with email OTP verification. Staff accounts are created by their respective managers using pre-generated employee codes.
- **JWT**: Access and refresh tokens via SimpleJWT. Custom token serializer embeds role information in the payload.

### `apps/mess`

Mess operations including menu management and extras booking.

- **Models**: `Mess`, `MessMenu`, `MessExtra`, `MessBooking`
- **Key flows**:
  - Mess managers configure daily menus (breakfast, lunch, dinner) and set extras items with quantities and prices
  - Students book extras from the available menu, receiving a QR code valid for a configurable time window (default: 3 hours)
  - Mess workers scan the QR code or manually enter the booking ID to verify and redeem bookings
- **Scheduled tasks**: Celery Beat handles automatic booking expiry and daily inventory resets

### `apps/canteen`

Canteen entity management with menus and categories.

- **Models**: `Canteen`, `CanteenMenuCategory`, `CanteenMenuItem`
- **Features**: Category-based menu organization, item availability toggles, pricing, delivery fee configuration, and canteen ratings

### `apps/orders`

Order lifecycle management for canteen orders (pickup and delivery).

- **Models**: `CanteenOrder`, `OrderItem`, `OrderStatusHistory`
- **Order states**: `pending` -> `confirmed` -> `preparing` -> `ready` -> `out_for_delivery` -> `delivered`
- **Delivery flow**: Manager assigns a delivery coordinator when the order is ready. The coordinator picks up the food and enters the student's OTP to confirm delivery.
- **WebSocket**: Real-time order status updates pushed to students via Django Channels

### `apps/payments`

Razorpay payment integration.

- **Models**: `Payment`, `Refund`
- **Features**: Order creation on Razorpay, webhook-based payment verification, automatic refund processing on order cancellation
- **Security**: Webhook signature verification, idempotent payment processing

### `apps/crowd`

Camera feed management for the ML crowd monitoring service.

- **Models**: `CameraFeed`
- **Redis sync**: Active camera feeds are automatically synced to Redis (via Django signals on `post_save` / `post_delete`) so the FastAPI ML service can read them without direct database access
- **API**: Endpoints for managers to register, activate, and deactivate camera feeds

---

## API Structure

All API endpoints are prefixed with `/api/`:

```
/api/
  |-- auth/                  # Login, register, OTP verify, refresh token
  |-- users/                 # User profile, role info
  |-- health/                # Service health check
  |-- mess/
  |   |-- messes/            # Mess CRUD (admin/manager)
  |   |-- menu/              # Daily menu management
  |   |-- extras/            # Extras items CRUD
  |   |-- bookings/          # Booking create, list, verify, redeem
  |-- canteens/              # Canteen CRUD, menu items, categories
  |-- orders/                # Order create, status update, history
  |-- payments/              # Payment initiation, webhook, refunds
  |-- crowd/
      |-- feeds/             # Camera feed registration
      |-- status/            # Current crowd metrics (from Redis)
```

Interactive API documentation is available at:
- **Swagger UI**: `/api/docs/`
- **ReDoc**: `/api/redoc/`
- **OpenAPI Schema**: `/api/schema/`

---

## Authentication and Authorization

### JWT Flow

1. Student registers with email and receives an OTP
2. OTP verification activates the account
3. Login returns an access token (Bearer) and refresh token
4. All subsequent requests include `Authorization: Bearer <token>`

### RBAC

Permissions are enforced at the view level. Each endpoint checks the requesting user's role against the allowed roles for that operation:

| Role | Permissions |
|---|---|
| `admin_manager` | Full CRUD on all entities, create manager accounts |
| `mess_manager` | Manage own mess, menus, extras, bookings, workers, camera feeds |
| `canteen_manager` | Manage own canteen, menus, orders, delivery coordinators |
| `mess_worker` | Scan and verify QR bookings |
| `delivery_person` | Accept deliveries, enter OTP to complete |
| `student` | Book extras, order food, view crowd, manage profile |

---

## WebSocket (Django Channels)

The Daphne ASGI server (port 8001) handles WebSocket connections for real-time updates:

- **Order status changes**: Students receive live updates as their order moves through `confirmed` -> `preparing` -> `ready` -> `delivered`
- **Crowd data**: Crowd density metrics pushed from the ML service via Redis pub/sub

Connection endpoint: `ws://<host>/ws/`

---

## Background Tasks (Celery)

### Worker Tasks
- Send OTP emails asynchronously
- Process Razorpay webhook events
- Sync camera feeds to Redis

### Beat Schedule
- **Booking expiry**: Automatically expire unredeemed bookings after the validity window
- **Inventory reset**: Reset daily extras inventory counts at configurable times

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | Django secret key | dev key (change in production) |
| `DEBUG` | Debug mode | `True` |
| `DATABASE_*` | PostgreSQL connection | `postgres@db:5432/upside_dine_db` |
| `REDIS_URL` | Redis connection | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | Celery broker | `redis://redis:6379/1` |
| `RAZORPAY_KEY_ID` | Razorpay API key | (required for payments) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | (required for payments) |
| `EMAIL_HOST_USER` | SMTP username | (required for OTP) |
| `EMAIL_HOST_PASSWORD` | SMTP password | (required for OTP) |

---

## Local Development (without Docker)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with local PostgreSQL and Redis URLs

# Run migrations
python manage.py migrate

# Seed initial data (roles, admin account)
python manage.py seed_data

# Start development server
python manage.py runserver 0.0.0.0:8000

# In a separate terminal, start Celery worker
celery -A config worker -l info

# In another terminal, start Celery beat
celery -A config beat -l info

# In another terminal, start Daphne (WebSocket)
daphne -b 0.0.0.0 -p 8001 config.asgi:application
```

---

## Directory Structure

```
backend/
|-- api/                     # Health check endpoint, shared serializers
|-- apps/
|   |-- users/               # Custom user model, JWT auth, OTP, roles
|   |-- mess/                # Mess, menu, extras, bookings
|   |-- canteen/             # Canteen, categories, menu items
|   |-- orders/              # Order lifecycle, delivery assignment
|   |-- payments/            # Razorpay integration, webhooks
|   |-- crowd/               # Camera feed management, Redis sync
|-- config/
|   |-- settings.py          # Django configuration
|   |-- urls.py              # Root URL routing
|   |-- asgi.py              # ASGI config (Channels)
|   |-- wsgi.py              # WSGI config (Gunicorn)
|   |-- celery.py            # Celery app configuration
|-- manage.py
|-- requirements.txt
|-- Dockerfile
`-- .env.example
```
