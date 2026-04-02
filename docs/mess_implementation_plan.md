# Mess Interface Frontend — Implementation Plan (v2)

Build the complete `features/mess/` module as defined for Person C. **All hooks use the real backend API** (no mock data).

## Key Design Decisions

- **Styling**: Vanilla CSS matching the Stranger Things dark theme from `App.css` — dark backgrounds, neon-red `#d63434` accents, subtle glows. No Tailwind utility classes.
- **Real API integration**: All hooks call the backend via Axios. Backend uses JWT (simplejwt) — tokens stored in `localStorage` from login (`{access, refresh}`).
- **Axios client**: Since `lib/api.js` doesn't exist yet, we'll create it inside `features/mess/` as `api.js` (a lightweight Axios instance with JWT interceptor). This avoids conflicting with Person D's future `lib/api.js`.
- **QR code display**: Booking detail has a `qr_payload` field (string) returned by backend. We'll use `qrcode.react` for rendering (needs install) — or render the backend's QR image endpoint (`GET /api/mess/bookings/{id}/qr-image/`) directly as an `<img>`.
- **Lucide React** icons + **Framer Motion** animations (both already installed).
- **Recharts** for manager stats charts (already installed).

---

## Backend API Endpoint Reference

All mess endpoints are mounted at `/api/mess/`. Auth token: `Authorization: Bearer <access_token>`.

### Student Endpoints

| Method | URL | Permission | Request | Response |
|--------|-----|------------|---------|----------|
| `GET` | `/api/mess/` | Student | — | `[{id, name, location, hall_name, is_active}]` |
| `GET` | `/api/mess/{mess_id}/menu/` | Student | Query: `?meal_type=lunch&day_of_week=monday` | `[{id, mess, mess_name, item_name, description, price, meal_type, day_of_week, available_quantity, default_quantity, image_url, is_active}]` |
| `POST` | `/api/mess/extras/book/` | Student | `{menu_item: <id>, quantity: <int>, meal_type?, mess_id?}` | `MessBookingDetail` (see below) |
| `GET` | `/api/mess/bookings/` | Student | Query: `?status=pending` | `[{id, menu_item: {id, mess, mess_name, item_name, price, meal_type, day_of_week, image_url}, quantity, total_price, meal_type, booking_date, status, qr_expires_at, created_at}]` |
| `GET` | `/api/mess/bookings/{booking_id}/` | Student | — | `MessBookingDetail`: `{id, menu_item: <full>, quantity, total_price, meal_type, booking_date, status, qr_code, qr_generated_at, qr_expires_at, qr_payload, redeemed_at, redeemed_by_staff, created_at, updated_at}` |
| `GET` | `/api/mess/bookings/{booking_id}/qr-image/` | Student | — | PNG image (binary) |
| `POST` | `/api/mess/bookings/{booking_id}/cancel/` | Student | `{}` | `MessBookingDetail` |

### Manager Endpoints

| Method | URL | Permission | Request | Response |
|--------|-----|------------|---------|----------|
| `GET` | `/api/mess/manager/menu/` | MessManager | Query: `?meal_type=&day_of_week=&mess_id=` | `[MessMenuItem]` |
| `POST` | `/api/mess/manager/menu/` | MessManager | `{mess, item_name, description, price, meal_type, day_of_week, available_quantity, default_quantity, image_url, is_active}` | `MessMenuItem` |
| `PATCH` | `/api/mess/manager/menu/{menu_item_id}/` | MessManager | Partial fields | `MessMenuItem` |
| `DELETE` | `/api/mess/manager/menu/{menu_item_id}/` | MessManager | — | 204 |
| `GET` | `/api/mess/manager/bookings/` | MessManager | Query: `?status=&meal_type=&booking_date=&mess_id=` | `{stats: {total, pending, redeemed, expired, cancelled}, results: [MessBookingList]}` |
| `GET` | `/api/mess/manager/stats/` | MessManager | Query: `?booking_date_from=&booking_date_to=&mess_id=` | `{mess_id, mess_name, total_bookings, total_redeemed, total_cancelled, total_expired, total_pending, total_revenue, most_popular_item}` |
| `GET` | `/api/mess/manager/inventory/` | MessManager | Query: `?mess_id=` | `[MessMenuItem]` |
| `PATCH` | `/api/mess/manager/inventory/` | MessManager | `{menu_item_id, available_quantity?, default_quantity?}` | `MessMenuItem` |

### Worker Endpoints

| Method | URL | Permission | Response |
|--------|-----|------------|----------|
| `POST` | `/api/mess/worker/verify/` | MessWorker | `{qr_code: <string>}` or `{booking_id: <int>}` → `MessBookingDetail` |
| `GET` | `/api/mess/worker/scan-history/` | MessWorker | `[MessBookingList]` |

### Mess Account (users app)

| Method | URL | Permission | Response |
|--------|-----|------------|----------|
| `GET` | `/api/users/me/mess-account/` | Authenticated | `{balance: "2450.00", last_updated: "ISO datetime"}` |

---

## Proposed Changes

### Axios Client

#### [NEW] [api.js](file:///Users/divyanshyadav/Desktop/upside-dine/frontend/src/features/mess/api.js)
Lightweight Axios instance with JWT `Authorization` header interceptor (reads `access` token from `localStorage`) and 401 auto-redirect.

---

### React Query Hooks (`features/mess/hooks/`) — 13 files

All hooks use the real Axios client above. Each hook calls the exact endpoints listed in the API reference table.

| File | Endpoint | Type |
|------|----------|------|
| `useMessList.js` | `GET /api/mess/` | Query |
| `useMessMenu.js` | `GET /api/mess/{id}/menu/?meal_type=&day_of_week=` | Query |
| `useBookExtras.js` | `POST /api/mess/extras/book/` | Mutation |
| `useMyBookings.js` | `GET /api/mess/bookings/` | Query |
| `useBookingDetail.js` | `GET /api/mess/bookings/{id}/` | Query |
| `useCancelBooking.js` | `POST /api/mess/bookings/{id}/cancel/` | Mutation |
| `useMessAccount.js` | `GET /api/users/me/mess-account/` | Query |
| `useManagerMenu.js` | `GET/POST/PATCH/DELETE /api/mess/manager/menu/` | Query + Mutations |
| `useManagerBookings.js` | `GET /api/mess/manager/bookings/` | Query |
| `useManagerInventory.js` | `GET/PATCH /api/mess/manager/inventory/` | Query + Mutation |
| `useManagerStats.js` | `GET /api/mess/manager/stats/` | Query |
| `useVerifyQR.js` | `POST /api/mess/worker/verify/` | Mutation |
| `useScanHistory.js` | `GET /api/mess/worker/scan-history/` | Query |

---

### Components (`features/mess/components/`) — 8 files

| File | Description |
|------|-------------|
| `MessCard.jsx` | Mess hall card (name, hall_name, location, active status dot) |
| `MenuItemCard.jsx` | Menu item: item_name, description, price, meal_type badge, available_quantity, "Book" button |
| `ExtrasBookingModal.jsx` | Modal: select quantity → calls `useBookExtras` mutation → on success shows booking detail with QR |
| `QRCodeDisplay.jsx` | Renders QR from backend's `qr-image` endpoint (`<img src="/api/mess/bookings/{id}/qr-image/">`), countdown timer to `qr_expires_at`, visual states (valid/expiring-soon/expired) |
| `CancelBookingButton.jsx` | Button + confirm dialog → calls `useCancelBooking` mutation |
| `MessAccountCard.jsx` | Shows `balance` + `last_updated` from `useMessAccount` hook |
| `MessAccountHistory.jsx` | Transaction list (uses `useMyBookings` filtered data as proxy — backend has no separate transaction endpoint) |
| `VerificationResult.jsx` | Success/failure result card after worker QR scan — shows booking details |

---

### Student Pages (`features/mess/pages/`) — 4 files

| File | Description |
|------|-------------|
| `MessListPage.jsx` | Lists mess halls from `useMessList`, matches `mess.html` design with feature cards |
| `MessMenuPage.jsx` | Menu with meal-type tabs + day filter, uses `useMessMenu(messId, {meal_type, day_of_week})`, "Book" opens `ExtrasBookingModal` |
| `MyBookingsPage.jsx` | Student's bookings from `useMyBookings`, filterable by status tabs |
| `BookingDetailPage.jsx` | Booking detail from `useBookingDetail(id)`, prominent QR display, countdown timer, cancel button |

---

### Manager Pages — 4 files

| File | Description |
|------|-------------|
| `ManagerMenuPage.jsx` | CRUD via `useManagerMenu`, meal-type tabs, add/edit modal, matches `admin-mess-manager.html` |
| `ManagerBookingsPage.jsx` | Today's bookings from `useManagerBookings`, stats summary cards at top |
| `ManagerInventoryPage.jsx` | Inventory from `useManagerInventory`, inline editable quantity fields |
| `ManagerStatsPage.jsx` | Stats from `useManagerStats` + Recharts visualizations |

---

### Worker Pages — 2 files

| File | Description |
|------|-------------|
| `QRScannerPage.jsx` | Manual booking ID input + verify button via `useVerifyQR`, matches `admin-mess-worker.html` |
| `ScanHistoryPage.jsx` | Recent scans from `useScanHistory` with valid/invalid badges |

---

### CSS & Routes

#### [NEW] [mess.css](file:///Users/divyanshyadav/Desktop/upside-dine/frontend/src/features/mess/mess.css)
All mess-specific styles following the Stranger Things theme.

#### [NEW] [routes.jsx](file:///Users/divyanshyadav/Desktop/upside-dine/frontend/src/features/mess/routes.jsx)
Exports all 10 mess routes as `<Route>` elements.

#### [MODIFY] [App.jsx](file:///Users/divyanshyadav/Desktop/upside-dine/frontend/src/App.jsx)
Import and mount mess routes.

---

## Verification Plan

### Build Check
- `npm run build` — zero compilation errors

### Live Testing
- Run with backend via `docker-compose up` and navigate all 10 routes
- Verify real API calls in browser DevTools Network tab
