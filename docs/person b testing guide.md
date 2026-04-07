# Person B Testing Guide (Start to End)

This guide covers full testing for Person B scope (`apps/mess`) from phase 1 through final handoff, including:

- setup verification
- all Person B APIs
- request payloads
- expected success/error responses
- edge-case checks
- Postman flow from login -> booking -> QR -> worker verify -> manager analytics

---

## 1. Scope and API Map

Base URL:

```text
http://localhost:8000
```

Person B API prefix:

```text
/api/mess/
```

Implemented endpoints:

| Area | Method | Endpoint |
|---|---|---|
| Health (global) | GET | `/api/health/` |
| Auth (dependency for testing) | POST | `/api/auth/login/` |
| Auth (dependency for testing) | POST | `/api/auth/refresh/` |
| Auth (dependency for testing) | GET | `/api/users/me/` |
| Auth (dependency for testing) | GET | `/api/users/me/mess-account/` |
| Student | GET | `/api/mess/` |
| Student | GET | `/api/mess/{mess_id}/menu/` |
| Student | POST | `/api/mess/extras/book/` |
| Student | GET | `/api/mess/bookings/` |
| Student | GET | `/api/mess/bookings/{booking_id}/` |
| Student | GET | `/api/mess/bookings/{booking_id}/qr-image/` |
| Student | POST | `/api/mess/bookings/{booking_id}/cancel/` |
| Manager | GET/POST | `/api/mess/manager/menu/` |
| Manager | PATCH/DELETE | `/api/mess/manager/menu/{menu_item_id}/` |
| Manager | GET | `/api/mess/manager/bookings/` |
| Manager | GET | `/api/mess/manager/stats/` |
| Manager | GET/PATCH | `/api/mess/manager/inventory/` |
| Worker | POST | `/api/mess/worker/verify/` |
| Worker | GET | `/api/mess/worker/scan-history/` |

Important schema note:

- `MessBooking.id` is global (table-wide auto-increment), not per-mess sequence.

---

## 2. Environment Prerequisites

Run services:

```bash
docker-compose up -d --build db redis backend celery_worker celery_beat channels
```

Apply migrations:

```bash
docker-compose exec -T backend python manage.py migrate
```

Optional superuser (if needed for admin):

```bash
docker-compose exec -T backend python manage.py createsuperuser
```

Authentication mode:

- JWT Bearer token in `Authorization` header.
- Correct format:

```text
Authorization: Bearer <access_token>
```

Do not send custom header keys like `access_token`; DRF JWT auth reads `Authorization`.

---

## 3. Seed Data Checklist (One-Time)

You can seed via admin (`/admin/`) or shell. Minimum data needed:

- roles: `student`, `mess_manager`, `mess_worker`
- one student user + `Student` profile + `MessAccount`
- one manager user + `Staff` profile
- one worker user + `Staff` profile
- one active `Mess`
- 2-3 `MessMenuItem` rows
- `MessStaffAssignment` for manager and worker to that mess

Recommended sample accounts:

- Student: `student1@iitk.ac.in` / `abc12345`
- Manager: `manager1@iitk.ac.in` / `abc12345`
- Worker: `worker1@iitk.ac.in` / `abc12345`

If these do not exist, create equivalent accounts and use them in all requests.

---

## 4. Postman Workspace Setup

Create collection variables:

- `base_url = http://localhost:8000`
- `student_access =`
- `student_refresh =`
- `manager_access =`
- `manager_refresh =`
- `worker_access =`
- `worker_refresh =`
- `mess_id =`
- `menu_item_id =`
- `booking_id =`
- `qr_code =`

For protected APIs in Postman:

- `Authorization` tab -> Type `Bearer Token` -> use the relevant access variable.

Common headers:

```text
Content-Type: application/json
```

---

## 5. Phase-wise Testing Plan

## Phase 1-3: App bootstrap, models, admin

### What to verify

- app loads and migrations apply
- admin registrations exist for all mess models
- model constraints enforce valid data

### How to test

1. Open `/admin/` and login as superuser.
2. Confirm admin sections:
   - Messes
   - Mess menu items
   - Mess bookings
   - Mess staff assignments
3. Try creating invalid values:
   - negative stock
   - duplicate same item/day/meal in same mess
4. Confirm DB rejects invalid rows.

### Expected outcomes

- invalid records fail validation/DB constraints
- admin list filters/search usable

---

## Phase 4-5: Service + serializer validation behavior

These are mostly exercised through API tests below. Additional CLI checks:

Run service-layer tests:

```bash
docker-compose exec -T backend python manage.py test apps.mess.tests.test_services -v 2
docker-compose exec -T backend python manage.py test apps.mess.tests.test_serializers -v 2
```

Expected:

- insufficient stock -> 400 validation path
- insufficient balance -> 400 validation path
- duplicate redeem blocked
- cancellation refund/restore inventory works

---

## Phase 6-7: Student APIs + filtering

All student APIs require role `student`.

## 6.1 Login (Student)

`POST /api/auth/login/`

Request:

```json
{
  "email": "student1@iitk.ac.in",
  "password": "abc12345"
}
```

Success `200`:

```json
{
  "access": "<jwt_access>",
  "refresh": "<jwt_refresh>",
  "user": {
    "id": 10,
    "email": "student1@iitk.ac.in",
    "role": "student",
    "is_superuser": false
  }
}
```

Failure `400`:

```json
{
  "non_field_errors": [
    "Invalid email or password."
  ]
}
```

## 6.2 Health check behavior

`GET /api/health/`

Without token -> `401`:

```json
{
  "detail": "Authentication credentials were not provided."
}
```

With Bearer token -> `200`:

```json
{
  "status": "healthy",
  "message": "API is running",
  "database": "connected",
  "version": "1.0.0"
}
```

## 6.3 Get active mess list

`GET /api/mess/`

Auth: Student token.

Success `200`:

```json
[
  {
    "id": 1,
    "name": "Hall Mess 1",
    "location": "Zone A",
    "hall_name": "Hall 1",
    "is_active": true
  }
]
```

Edge cases:

- No token -> `401`
- Wrong role (`mess_worker`) -> `403`

## 6.4 Get menu for a mess

`GET /api/mess/{mess_id}/menu/`

Query params:

- `meal_type` in `breakfast|lunch|dinner|snack`
- `day_of_week` in `monday...sunday`
- `is_active` in `true|false`

Example:

`GET /api/mess/1/menu/?meal_type=lunch&day_of_week=monday&is_active=true`

Success `200`:

```json
[
  {
    "id": 1,
    "mess": 1,
    "mess_name": "Hall Mess 1",
    "item_name": "Paneer Roll",
    "description": "Tasty roll",
    "price": "40.00",
    "meal_type": "lunch",
    "day_of_week": "monday",
    "available_quantity": 10,
    "default_quantity": 12,
    "image_url": "",
    "is_active": true
  }
]
```

Error cases:

- invalid boolean `is_active=maybe` -> `400`:

```json
{
  "is_active": "Invalid boolean value. Use true or false."
}
```

- inactive/non-existent mess id -> `404`

## 6.5 Create extras booking

`POST /api/mess/extras/book/`

Required payload:

```json
{
  "menu_item": 1,
  "quantity": 2
}
```

Optional fields:

- `meal_type`
- `mess_id`

Success `201`:

```json
{
  "id": 101,
  "menu_item": {
    "id": 1,
    "mess": 1,
    "mess_name": "Hall Mess 1",
    "item_name": "Paneer Roll",
    "description": "Tasty roll",
    "price": "40.00",
    "meal_type": "lunch",
    "day_of_week": "monday",
    "available_quantity": 8,
    "default_quantity": 12,
    "image_url": "",
    "is_active": true
  },
  "quantity": 2,
  "total_price": "80.00",
  "meal_type": "lunch",
  "booking_date": "2026-03-23",
  "status": "pending",
  "qr_code": "mess_xxxxxxxxxxxxxxxxxxxxxxxx",
  "qr_generated_at": "2026-03-23T00:00:00Z",
  "qr_expires_at": "2026-03-23T03:00:00Z",
  "qr_payload": {
    "booking_id": 101,
    "qr_code": "mess_xxxxxxxxxxxxxxxxxxxxxxxx",
    "student_id": 5,
    "menu_item_id": 1,
    "expires_at": "2026-03-23T03:00:00+00:00"
  },
  "redeemed_at": null,
  "redeemed_by_staff": null,
  "created_at": "2026-03-23T00:00:00Z",
  "updated_at": "2026-03-23T00:00:00Z"
}
```

Error cases `400`:

- inactive item:

```json
{
  "menu_item": "Selected menu item is inactive."
}
```

- insufficient stock / balance:

```json
{
  "detail": "Insufficient stock for requested quantity."
}
```

```json
{
  "detail": "Insufficient mess account balance."
}
```

- `mess_id` mismatch:

```json
{
  "mess_id": "Provided mess_id does not match the selected menu item's mess."
}
```

- `meal_type` mismatch:

```json
{
  "meal_type": "Requested meal_type does not match selected menu item."
}
```

## 6.6 List student bookings

`GET /api/mess/bookings/`

Success `200`:

```json
[
  {
    "id": 101,
    "menu_item": {
      "id": 1,
      "mess": 1,
      "mess_name": "Hall Mess 1",
      "item_name": "Paneer Roll",
      "price": "40.00",
      "meal_type": "lunch",
      "day_of_week": "monday",
      "image_url": ""
    },
    "quantity": 2,
    "total_price": "80.00",
    "meal_type": "lunch",
    "booking_date": "2026-03-23",
    "status": "pending",
    "qr_expires_at": "2026-03-23T03:00:00Z",
    "created_at": "2026-03-23T00:00:00Z"
  }
]
```

Behavior:

- only current student’s bookings
- newest first

## 6.7 Booking detail

`GET /api/mess/bookings/{booking_id}/`

Success `200`: same structure as create-booking response (detail serializer).

Cross-student access -> `404`.

## 6.8 Booking QR image

`GET /api/mess/bookings/{booking_id}/qr-image/`

Success:

- status `200`
- content type `image/png`
- response body is raw PNG bytes

Postman tip:

- use `Send and Download` to save PNG.

Cross-student access -> `404`.

## 6.9 Cancel booking

`POST /api/mess/bookings/{booking_id}/cancel/`

Optional payload flags:

```json
{
  "refund": true,
  "restore_inventory": true
}
```

Success `200`:

```json
{
  "id": 101,
  "status": "cancelled",
  "total_price": "80.00"
}
```

Error cases `400`:

- expired:

```json
{
  "detail": "Expired booking cannot be cancelled."
}
```

- already redeemed/cancelled:

```json
{
  "detail": "Only pending bookings can be cancelled, got 'redeemed'."
}
```

Cross-student path -> `404`.

---

## Phase 8: Manager APIs

All manager APIs require role `mess_manager`.

If manager has multiple active assignments, include `mess_id` in query/body.

## 8.1 Login (Manager)

`POST /api/auth/login/`

```json
{
  "email": "manager1@iitk.ac.in",
  "password": "abc12345"
}
```

Store token in `manager_access`.

## 8.2 Manager menu list

`GET /api/mess/manager/menu/`

Optional filters:

- `meal_type`
- `day_of_week`
- `is_active`
- `mess_id` (required if multiple assignments)

Success `200`: array of `MessMenuItemSerializer`.

Common errors:

- no assignment -> `403` (`No active manager assignment found for this mess.`)
- multiple assignment without `mess_id` -> `400`
- invalid filter value -> `400`

## 8.3 Manager menu create

`POST /api/mess/manager/menu/`

Payload:

```json
{
  "item_name": "Chole Bhature",
  "description": "Special lunch item",
  "price": "60.00",
  "meal_type": "lunch",
  "day_of_week": "wednesday",
  "available_quantity": 80,
  "default_quantity": 90,
  "image_url": "",
  "is_active": true
}
```

Success `201`:

```json
{
  "id": 25,
  "mess": 1,
  "mess_name": "Hall Mess 1",
  "item_name": "Chole Bhature",
  "price": "60.00",
  "meal_type": "lunch",
  "day_of_week": "wednesday",
  "available_quantity": 80,
  "default_quantity": 90,
  "is_active": true
}
```

Error `400` if trying to create in another mess:

```json
{
  "mess": "Managers can create menu items only for their assigned mess."
}
```

## 8.4 Manager menu patch

`PATCH /api/mess/manager/menu/{menu_item_id}/`

Payload example:

```json
{
  "available_quantity": 250,
  "price": "42.50"
}
```

Success `200` with updated item payload.

Errors:

- changing mess forbidden `400`:

```json
{
  "mess": "Changing mess is not allowed from manager menu endpoint."
}
```

- item outside manager scope -> `404`

## 8.5 Manager menu delete (soft delete)

`DELETE /api/mess/manager/menu/{menu_item_id}/`

Success: `204 No Content`.

Verification:

- fetch menu list and confirm item has `is_active = false`.

## 8.6 Manager bookings list + stats

`GET /api/mess/manager/bookings/`

Default behavior:

- returns today’s bookings only if no date filters are supplied.

Response `200`:

```json
{
  "stats": {
    "total": 4,
    "pending": 1,
    "redeemed": 1,
    "expired": 1,
    "cancelled": 1
  },
  "results": [
    {
      "id": 101,
      "status": "pending",
      "booking_date": "2026-03-23"
    }
  ]
}
```

Filters:

- `status=pending|redeemed|expired|cancelled`
- `meal_type=breakfast|lunch|dinner|snack`
- `booking_date=YYYY-MM-DD`
- `booking_date_from=YYYY-MM-DD`
- `booking_date_to=YYYY-MM-DD`
- `mess_id` (if multiple assignments)

Invalid filter -> `400`.

## 8.7 Manager stats

`GET /api/mess/manager/stats/`

Supports same filter family as bookings endpoint.

Success `200`:

```json
{
  "mess_id": 1,
  "mess_name": "Hall Mess 1",
  "total_bookings": 3,
  "total_redeemed": 2,
  "total_cancelled": 1,
  "total_expired": 0,
  "total_pending": 0,
  "total_revenue": "190.00",
  "most_popular_item": {
    "menu_item_id": 1,
    "item_name": "Paneer Roll",
    "total_quantity": 4
  }
}
```

## 8.8 Manager inventory

### GET `/api/mess/manager/inventory/`

Success `200`: list of menu items for assigned mess.

### PATCH `/api/mess/manager/inventory/`

Payload:

```json
{
  "menu_item_id": 1,
  "available_quantity": 222,
  "default_quantity": 250
}
```

Success `200`:

```json
{
  "id": 1,
  "available_quantity": 222,
  "default_quantity": 250
}
```

Errors:

- missing `menu_item_id` -> `400`
- invalid `menu_item_id` type -> `400`
- negative quantity -> `400`
- menu item outside manager mess -> `404`

---

## Phase 9: Worker APIs (QR verification)

All worker APIs require role `mess_worker`.

If worker has multiple active assignments, include `mess_id`.

## 9.1 Login (Worker)

`POST /api/auth/login/`

```json
{
  "email": "worker1@iitk.ac.in",
  "password": "abc12345"
}
```

Store token in `worker_access`.

## 9.2 Verify booking by booking_id

`POST /api/mess/worker/verify/`

Payload:

```json
{
  "booking_id": 101
}
```

If multi-assignment worker:

```json
{
  "booking_id": 101,
  "mess_id": 1
}
```

Success `200`:

```json
{
  "id": 101,
  "status": "redeemed",
  "redeemed_at": "2026-03-23T01:00:00Z",
  "redeemed_by_staff": {
    "id": 8,
    "full_name": "Worker One",
    "employee_code": "W-001"
  }
}
```

## 9.3 Verify booking by qr_code

`POST /api/mess/worker/verify/`

Payload:

```json
{
  "qr_code": "mess_xxxxxxxxxxxxxxxxxxxxxxxx"
}
```

Success `200` same as booking verify response.

## 9.4 Verify endpoint error matrix

`400` expected examples:

- neither booking_id nor qr_code:

```json
{
  "non_field_errors": [
    "Provide either qr_code or booking_id."
  ]
}
```

- both booking_id and qr_code:

```json
{
  "non_field_errors": [
    "Provide only one of qr_code or booking_id."
  ]
}
```

- invalid qr:

```json
{
  "qr_code": "Invalid QR code."
}
```

- cross-mess booking:

```json
{
  "detail": "Booking does not belong to worker's assigned mess."
}
```

- already redeemed:

```json
{
  "detail": "Booking is already redeemed."
}
```

- expired:

```json
{
  "detail": "QR code has expired."
}
```

Other auth errors:

- no token -> `401`
- wrong role -> `403`
- no active worker assignment -> `403`
- multiple assignments without `mess_id` -> `400`

## 9.5 Worker scan history

`GET /api/mess/worker/scan-history/`

If worker has multiple assignments:

- call with `?mess_id=<id>`

Success `200`:

```json
[
  {
    "id": 102,
    "status": "redeemed",
    "booking_date": "2026-03-23"
  },
  {
    "id": 101,
    "status": "redeemed",
    "booking_date": "2026-03-23"
  }
]
```

Behavior:

- returns recent scans for current worker and assigned mess
- prefers Redis cached order; fallback query if cache empty

---

## Phase 10: Celery task testing

These are not HTTP endpoints. Test from terminal.

## 10.1 Expire stale bookings

Command:

```bash
docker-compose exec -T backend python manage.py shell -c "from apps.mess.tasks import expire_stale_bookings; print(expire_stale_bookings())"
```

Expected dict:

```python
{
  'processed_count': 1,
  'expired_count': 1,
  'skipped_count': 0,
  'restore_inventory': True
}
```

Validation points:

- pending + expired QR bookings change status to `expired`
- inventory restores when `restore_inventory=True`
- non-pending rows are skipped

## 10.2 Daily inventory reset

Command:

```bash
docker-compose exec -T backend python manage.py shell -c "from apps.mess.tasks import reset_daily_menu_inventory; print(reset_daily_menu_inventory())"
```

Expected dict:

```python
{
  'updated_count': 2
}
```

Validation points:

- active items `available_quantity` reset to `default_quantity`
- inactive items remain unchanged

---

## Phase 11: Automated test suite commands

Run full Person B suite:

```bash
docker-compose exec -T backend python manage.py test apps.mess.tests -v 2
```

Run by module:

```bash
docker-compose exec -T backend python manage.py test apps.mess.tests.test_models -v 2
docker-compose exec -T backend python manage.py test apps.mess.tests.test_services -v 2
docker-compose exec -T backend python manage.py test apps.mess.tests.test_student_api -v 2
docker-compose exec -T backend python manage.py test apps.mess.tests.test_manager_api -v 2
docker-compose exec -T backend python manage.py test apps.mess.tests.test_worker_api -v 2
docker-compose exec -T backend python manage.py test apps.mess.tests.test_tasks -v 2
docker-compose exec -T backend python manage.py test apps.mess.tests.test_race_conditions -v 2
```

Current expected result in this repo state:

- all tests pass for `apps.mess.tests`.

---

## Phase 12-13: Final E2E acceptance run in Postman

Run this exact order:

1. `POST /api/auth/login/` as manager.
2. `POST /api/auth/login/` as student.
3. `POST /api/auth/login/` as worker.
4. Manager: `POST /api/mess/manager/menu/` to create a fresh item.
5. Student: `GET /api/mess/` and `GET /api/mess/{mess_id}/menu/`.
6. Student: `POST /api/mess/extras/book/` -> save `booking_id` + `qr_code`.
7. Student: `GET /api/mess/bookings/{booking_id}/` verify `pending`.
8. Student: `GET /api/mess/bookings/{booking_id}/qr-image/` verify PNG.
9. Worker: `POST /api/mess/worker/verify/` using `booking_id` or `qr_code`.
10. Worker: `GET /api/mess/worker/scan-history/` contains booking.
11. Student: `GET /api/mess/bookings/{booking_id}/` now `redeemed`.
12. Manager: `GET /api/mess/manager/bookings/` and `/stats/` reflect redeemed count/revenue.

Cancellation branch:

1. Student creates second booking.
2. Student calls cancel endpoint.
3. Verify student mess account balance restored.
4. Verify item stock restored via manager inventory endpoint.

Expiry branch:

1. Create booking.
2. Force expiry in DB (or wait past expiry).
3. Run `expire_stale_bookings`.
4. Verify status becomes `expired`.
5. Verify worker verify now fails with `QR code has expired.`

---

## 6. Postman-specific Troubleshooting

`401 Authentication credentials were not provided.`:

- set `Authorization: Bearer <access_token>` in Authorization tab.
- do not put token in a random header key.

`403` on mess endpoints:

- token role mismatch (`student` token on manager route etc.).

`400` requiring `mess_id`:

- manager/worker has multiple active assignments; pass `mess_id`.

`429` during tests:

- API rate limit middleware can trigger under repeated rapid calls; retry after short pause.

`booking not found`/`404`:

- student can only access own bookings.
- manager/worker scope is restricted to assigned mess.

---

## 7. Quick Reference: Payloads by Endpoint

`POST /api/auth/login/`

```json
{"email":"user@example.com","password":"secret"}
```

`POST /api/auth/refresh/`

```json
{"refresh":"<refresh_token>"}
```

`POST /api/mess/extras/book/`

```json
{"menu_item":1,"quantity":2,"meal_type":"lunch","mess_id":1}
```

`POST /api/mess/bookings/{booking_id}/cancel/`

```json
{"refund":true,"restore_inventory":true}
```

`POST /api/mess/manager/menu/`

```json
{
  "item_name":"Chole Bhature",
  "description":"Special lunch item",
  "price":"60.00",
  "meal_type":"lunch",
  "day_of_week":"wednesday",
  "available_quantity":80,
  "default_quantity":90,
  "image_url":"",
  "is_active":true
}
```

`PATCH /api/mess/manager/menu/{menu_item_id}/`

```json
{"available_quantity":250,"price":"42.50"}
```

`PATCH /api/mess/manager/inventory/`

```json
{"menu_item_id":1,"available_quantity":222,"default_quantity":250}
```

`POST /api/mess/worker/verify/`

```json
{"booking_id":101}
```

or

```json
{"qr_code":"mess_xxxxxxxxxxxxxxxxxxxxxxxx"}
```

---

## 8. Definition of Done for Person B Testing

Mark Person B as fully verified when:

- all student flows pass (browse, book, view, cancel, QR image access)
- all manager flows pass (menu CRUD, bookings/stats, inventory update)
- all worker flows pass (verify by booking_id/qr_code, scan history)
- task flows pass (expire stale, reset inventory)
- role isolation and mess scoping checks pass
- full `apps.mess.tests` suite passes

