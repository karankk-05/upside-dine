# Frontend — Work Distribution (4 People)

> **Project**: UpsideDine | **Tech Stack**: React 18, Vite, Tailwind CSS, Zustand (state), React Query (server state), Framer Motion (animations), Recharts (charts), react-hook-form + Zod (forms), Axios (HTTP), Lucide React (icons)
>
> **Guiding Principle**: Each person owns **separate feature directories** inside `src/` so that parallel work produces **zero merge conflicts** on GitHub. Shared touchpoints (`src/lib/`, `src/components/ui/`, `tailwind.config.js`) are edited only by one designated person or at pre-agreed integration points.
>
> **Assumption**: The **Auth screens** (Login, Register, OTP Verification, Forgot/Reset Password) have already been completed and are not part of this distribution.

---

## Project Structure Quick-Reference

```
frontend/src/
├── app/                         # App entry, routing, providers (Person D owns)
│   ├── App.jsx
│   ├── Router.jsx               # Central route definitions
│   └── Providers.jsx            # QueryClient, Zustand, Toast, Theme
├── components/
│   ├── ui/                      # Shared design-system primitives (Person D owns)
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Skeleton.jsx
│   │   ├── Badge.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Tabs.jsx
│   │   └── ...
│   └── layout/                  # Shared layout components (Person D owns)
│       ├── Navbar.jsx
│       ├── BottomNav.jsx
│       ├── Sidebar.jsx
│       └── PageWrapper.jsx
├── features/
│   ├── ml/                      # Person A — ML / Crowd Monitoring Interface
│   ├── canteen/                 # Person B — Canteen Interface
│   ├── mess/                    # Person C — Mess Interface
│   └── settings/               # Person D — Settings, User Profile, etc.
├── hooks/                       # Shared custom hooks (Person D owns)
│   ├── useAuth.js
│   ├── useWebSocket.js
│   └── useMediaQuery.js
├── lib/                         # Shared utilities (Person D owns)
│   ├── api.js                   # Axios instance with interceptors
│   ├── constants.js
│   ├── utils.js
│   └── queryKeys.js             # React Query key factory
├── stores/                      # Zustand stores (Person D owns base, others add slices)
│   ├── authStore.js             # Already done (auth)
│   ├── cartStore.js             # Person B creates
│   └── notificationStore.js     # Person D creates
├── assets/                      # Static assets (images, icons, lottie animations)
└── styles/
    └── index.css                # Tailwind directives + global custom styles
```

---

## Conflict-Avoidance Rules

| Rule | Details |
|------|---------|
| **Own your feature directories** | Each person creates, edits, and tests only their own `features/<name>/` directories. |
| **One person owns shared code** | Person D is the shared-code owner (`components/ui/`, `hooks/`, `lib/`, `app/`). Others request changes via PR or pair with Person D. |
| **Route registration** | Each person defines their feature routes in their own `features/<name>/routes.jsx`. Person D imports and mounts them in `Router.jsx`. |
| **Shared component requests** | If you need a new UI primitive (e.g., a date picker), ask Person D to build it in `components/ui/`. Don't create one-off versions in your feature. |
| **Store convention** | If you need global state, create a store file in `stores/` with a clear prefix (e.g., `cartStore.js`). Coordinate naming with Person D. |
| **API hooks** | Each person creates their own React Query hooks inside their feature folder (e.g., `features/canteen/hooks/useCanteenMenu.js`). |
| **Branch naming** | `personA/ml-dashboard`, `personB/canteen-menu-screen`, etc. Each person merges their own branches. |
| **Integration PRs** | When two features need to interact (e.g., canteen order → notification toast), the dependent person opens a PR against `main` after the dependency is merged. |

---

## Person A — ML / Crowd Monitoring Interface

**Feature directory owned**: `features/ml/`

### What to build

#### 1. Crowd Monitoring Dashboard — Student View

| Screen / Component | Description |
|---------------------|-------------|
| `MeassLiveDensity.jsx` | Real-time crowd density cards for each mess — shows density level (low / moderate / high), estimated wait time, people count, and a color-coded indicator. Auto-refreshes via WebSocket (`crowd_mess_{id}` channel). |
| `CrowdHistoryChart.jsx` | Hourly crowd density chart (using Recharts) for a selected mess — lets students identify the best time to visit. Day selector to view past trends. |
| `BestTimeRecommendation.jsx` | Recommendation card showing the optimal time to visit based on historical crowd data from the `/api/crowd/mess/{id}/recommendation/` endpoint. |
| `MessSelector.jsx` | Dropdown or tab bar to switch between different mess halls. |

#### 2. Crowd Monitoring Dashboard — Manager View

| Screen / Component | Description |
|---------------------|-------------|
| `ManagerCrowdOverview.jsx` | Admin-level overview with all messes' live density on a single dashboard. Cards with trend arrows (up/down vs. previous hour). |
| `CameraFeedStatus.jsx` | Status cards for each camera feed — shows active/offline status, last update time. |
| `CrowdAnalytics.jsx` | Detailed analytics page with multi-day charts, peak hour heatmap, and average wait time stats using Recharts. |

#### 3. React Query Hooks (`features/ml/hooks/`)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useLiveCrowdDensity(messId)` | `GET /api/crowd/mess/{id}/live/` | Polls live density data (fallback for WebSocket) |
| `useCrowdHistory(messId, date)` | `GET /api/crowd/mess/{id}/history/` | Fetches hourly crowd history |
| `useCrowdRecommendation(messId)` | `GET /api/crowd/mess/{id}/recommendation/` | Fetches best-time recommendation |

#### 4. WebSocket Integration (`features/ml/hooks/useCrowdSocket.js`)
- Connect to `ws://.../ws/crowd/mess/{mess_id}/`
- Listen for `density_update` and `wait_time_update` events
- Update Zustand store / React Query cache on each event
- Auto-reconnect with exponential backoff

#### 5. Routes (`features/ml/routes.jsx`)

| Route | Component | Access |
|-------|-----------|--------|
| `/crowd` | `CrowdDashboard` (student view) | All authenticated users |
| `/crowd/mess/:messId` | `MessCrowdDetail` | All authenticated users |
| `/manager/crowd` | `ManagerCrowdOverview` | Mess Manager only |
| `/manager/crowd/analytics` | `CrowdAnalytics` | Mess Manager only |

### Files created

```
features/ml/
├── routes.jsx
├── pages/
│   ├── CrowdDashboard.jsx          # Student crowd overview page
│   └── MessCrowdDetail.jsx         # Detailed view for a specific mess
│   ├── ManagerCrowdOverview.jsx     # Manager dashboard page
│   └── CrowdAnalytics.jsx          # Manager analytics page
├── components/
│   ├── MessLiveDensity.jsx
│   ├── CrowdHistoryChart.jsx
│   ├── BestTimeRecommendation.jsx
│   ├── MessSelector.jsx
│   ├── CameraFeedStatus.jsx
│   ├── DensityIndicator.jsx         # Reusable density badge (low/med/high)
│   └── CrowdHeatmap.jsx             # Peak-hour heatmap visualization
└── hooks/
    ├── useLiveCrowdDensity.js
    ├── useCrowdHistory.js
    ├── useCrowdRecommendation.js
    └── useCrowdSocket.js
```

### SRS Requirements Covered
F3.1 – F3.8 (Crowd Monitoring — Student UI), relevant manager views for crowd monitoring

---

## Person B — Canteen Interface

**Feature directory owned**: `features/canteen/`

### What to build

#### 1. Canteen Browsing — Student View

| Screen / Component | Description |
|---------------------|-------------|
| `CanteenListPage.jsx` | List of all canteens with cards showing name, rating, open/closed status, delivery availability. Search bar to filter. |
| `CanteenDetailPage.jsx` | Single canteen detail — info header (hours, delivery fee, min order) + menu grouped by category (tabs or accordion). |
| `MenuItemCard.jsx` | Card for each menu item: name, price, veg/non-veg badge, prep time, image, "Add to Cart" button with quantity stepper. |
| `MenuSearch.jsx` | Global search across canteens via `/api/canteens/search/` — autocomplete dropdown showing items with canteen name. |

#### 2. Cart & Checkout — Student View

| Screen / Component | Description |
|---------------------|-------------|
| `CartDrawer.jsx` | Slide-out cart panel showing items, quantities, subtotal, delivery fee, and total. Edit quantity / remove items. |
| `CheckoutPage.jsx` | Checkout flow: order type selection (Pickup / Delivery / Pre-book), delivery address (if delivery), scheduled time (if pre-book), special instructions, payment summary. |
| `PaymentModal.jsx` | Razorpay checkout integration — loads Razorpay JS SDK, handles `create-order` → SDK popup → `verify` callback. Shows success/failure state. |
| `OrderConfirmation.jsx` | Post-payment success screen with order number, estimated ready time, and order details. |

#### 3. Order Tracking — Student View

| Screen / Component | Description |
|---------------------|-------------|
| `OrderHistoryPage.jsx` | List of past and active orders with status badges. Filter by status (active / completed / cancelled). |
| `OrderDetailPage.jsx` | Full order detail — items, amounts, status timeline (stepper UI showing: Placed → Confirmed → Preparing → Ready → Picked Up / Delivered). Auto-refreshes via WebSocket (`order_{id}` channel). |
| `OrderStatusTracker.jsx` | Compact status stepper component reused in order cards and detail page. |
| `PickupQRCode.jsx` | Displays QR code and OTP for self-pickup orders. |

#### 4. Canteen Manager Screens

| Screen / Component | Description |
|---------------------|-------------|
| `ManagerOrdersPage.jsx` | Live incoming orders dashboard — cards with new orders, accept/reject buttons. Filterable by status. Real-time via WebSocket. |
| `ManagerOrderDetail.jsx` | Expanded order view — items, customer info, status update buttons (Accept → Preparing → Ready), pickup verification (scan QR / enter OTP). |
| `ManagerMenuPage.jsx` | CRUD interface for managing menu items and categories — table/grid view, add/edit modal forms, toggle availability, image upload. |
| `ManagerStatsPage.jsx` | Daily revenue & order stats dashboard with Recharts (orders count, revenue bar chart, popular items pie chart). |

#### 5. Zustand Store (`stores/cartStore.js`)
- `items[]` — cart items with `menuItemId`, `canteenId`, `quantity`, `unitPrice`, `name`
- Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getTotal`, `getItemCount`
- Persist to `localStorage` so cart survives page refresh
- Enforce single-canteen cart (clear if adding item from different canteen, with confirmation prompt)

#### 6. React Query Hooks (`features/canteen/hooks/`)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useCanteenList()` | `GET /api/canteens/` | Fetch all canteens |
| `useCanteenDetail(id)` | `GET /api/canteens/{id}/` | Canteen info |
| `useCanteenMenu(id)` | `GET /api/canteens/{id}/menu/` | Menu items grouped by category |
| `useMenuSearch(query)` | `GET /api/canteens/search/?q=` | Search results (debounced) |
| `usePlaceOrder()` | `POST /api/orders/` | Mutation to place order |
| `useOrderHistory()` | `GET /api/orders/` | Student's orders |
| `useOrderDetail(id)` | `GET /api/orders/{id}/` | Single order detail |
| `useCancelOrder(id)` | `POST /api/orders/{id}/cancel/` | Cancel order mutation |
| `useCreatePayment()` | `POST /api/payments/create-order/` | Create Razorpay order |
| `useVerifyPayment()` | `POST /api/payments/verify/` | Verify payment |
| `useManagerOrders()` | `GET /api/canteen-manager/orders/` | Manager incoming orders |
| `useUpdateOrderStatus()` | `PATCH /api/canteen-manager/orders/{id}/status/` | Update order status |
| `useManagerMenu()` | `GET/POST /api/canteen-manager/menu/` | Manage menu items |
| `useManagerStats()` | `GET /api/canteen-manager/stats/` | Order & revenue stats |

#### 7. WebSocket Integration (`features/canteen/hooks/useOrderSocket.js`)
- Connect to `ws://.../ws/order/{order_id}/`
- Listen for `status_update` events to update order status in real-time
- Used in `OrderDetailPage` and `ManagerOrdersPage`

#### 8. Routes (`features/canteen/routes.jsx`)

| Route | Component | Access |
|-------|-----------|--------|
| `/canteens` | `CanteenListPage` | All authenticated users |
| `/canteens/:id` | `CanteenDetailPage` | All authenticated users |
| `/canteens/search` | `MenuSearch` (full page mode) | All authenticated users |
| `/cart` | `CartDrawer` (full page fallback) | Students |
| `/checkout` | `CheckoutPage` | Students |
| `/orders` | `OrderHistoryPage` | Students |
| `/orders/:id` | `OrderDetailPage` | Students |
| `/manager/canteen/orders` | `ManagerOrdersPage` | Canteen Manager |
| `/manager/canteen/orders/:id` | `ManagerOrderDetail` | Canteen Manager |
| `/manager/canteen/menu` | `ManagerMenuPage` | Canteen Manager |
| `/manager/canteen/stats` | `ManagerStatsPage` | Canteen Manager |

### Files created

```
features/canteen/
├── routes.jsx
├── pages/
│   ├── CanteenListPage.jsx
│   ├── CanteenDetailPage.jsx
│   ├── CheckoutPage.jsx
│   ├── OrderHistoryPage.jsx
│   ├── OrderDetailPage.jsx
│   ├── ManagerOrdersPage.jsx
│   ├── ManagerOrderDetail.jsx
│   ├── ManagerMenuPage.jsx
│   └── ManagerStatsPage.jsx
├── components/
│   ├── MenuItemCard.jsx
│   ├── MenuSearch.jsx
│   ├── CartDrawer.jsx
│   ├── PaymentModal.jsx
│   ├── OrderConfirmation.jsx
│   ├── OrderStatusTracker.jsx
│   ├── PickupQRCode.jsx
│   └── CanteenCard.jsx
└── hooks/
    ├── useCanteenList.js
    ├── useCanteenDetail.js
    ├── useCanteenMenu.js
    ├── useMenuSearch.js
    ├── usePlaceOrder.js
    ├── useOrderHistory.js
    ├── useOrderDetail.js
    ├── useCancelOrder.js
    ├── useCreatePayment.js
    ├── useVerifyPayment.js
    ├── useManagerOrders.js
    ├── useUpdateOrderStatus.js
    ├── useManagerMenu.js
    ├── useManagerStats.js
    └── useOrderSocket.js

stores/
└── cartStore.js                    # Person B creates this
```

### SRS Requirements Covered
F4.1 – F4.13 (Student Canteen Ordering UI), F7.1 – F7.11 (Canteen Manager UI)

---

## Person C — Mess Interface

**Feature directory owned**: `features/mess/`

### What to build

#### 1. Mess Browsing & Extras Booking — Student View

| Screen / Component | Description |
|---------------------|-------------|
| `MessListPage.jsx` | List of all mess halls with status cards (hall name, location, active/inactive). |
| `MessMenuPage.jsx` | Menu for a selected mess — filter by meal type (Breakfast / Lunch / Dinner / Snack) and day of week. Shows available quantity per item. |
| `ExtrasBookingModal.jsx` | Modal to book extras: select quantity, shows total price, confirm → deducts from mess account balance. Shows booking confirmation with QR code. |
| `MenuItemCard.jsx` | Card for mess menu items: item name, description, price, meal type badge, quantity available, "Book" button. *(Note: this is different from canteen's `MenuItemCard` — it lives inside `features/mess/components/`)* |

#### 2. Student Bookings & QR

| Screen / Component | Description |
|---------------------|-------------|
| `MyBookingsPage.jsx` | List of student's mess bookings with status (pending / redeemed / expired / cancelled). Filter by status. |
| `BookingDetailPage.jsx` | Booking detail view — item info, date, quantity, total, status. Displays QR code prominently (using a QR rendering library like `qrcode.react`). Shows countdown to QR expiry. |
| `QRCodeDisplay.jsx` | Reusable QR code component that renders the booking's QR token, shows expiry countdown timer, and visual state changes (valid → expiring-soon → expired). |
| `CancelBookingButton.jsx` | Confirmation dialog + cancel action for pending bookings. |

#### 3. Mess Account Widget

| Screen / Component | Description |
|---------------------|-------------|
| `MessAccountCard.jsx` | Card showing current mess account balance, last updated time. Used on the mess pages and also importable by Person D for the profile/settings page. |
| `MessAccountHistory.jsx` | Transaction history for mess account — debits from bookings. *(Data comes from `/api/users/me/mess-account/`)* |

#### 4. Mess Manager Screens

| Screen / Component | Description |
|---------------------|-------------|
| `ManagerMenuPage.jsx` | CRUD interface for managing mess menu items — add/edit/deactivate items, set available quantity, assign meal type and day. Table or grid layout with edit modal. |
| `ManagerBookingsPage.jsx` | Today's bookings dashboard — stats (total booked, redeemed, pending, expired), list of bookings with search. |
| `ManagerInventoryPage.jsx` | Inventory/stock view — update available quantities for today's items. |
| `ManagerStatsPage.jsx` | Booking statistics with Recharts — total bookings over time, redemption rates, popular items. |

#### 5. Mess Worker Screens

| Screen / Component | Description |
|---------------------|-------------|
| `QRScannerPage.jsx` | Camera-based QR scanner (or manual booking ID entry) → calls verify endpoint → shows result (success ✓ with item details, or error ✗ with reason). Uses a QR scanning library (e.g., `html5-qrcode` or `react-qr-reader`). |
| `ScanHistoryPage.jsx` | List of recently scanned/verified bookings for current session. |
| `VerificationResult.jsx` | Success/failure result card after scan — shows booking details, student name, item, quantity. |

#### 6. React Query Hooks (`features/mess/hooks/`)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useMessList()` | `GET /api/mess/` | List all messes |
| `useMessMenu(messId, filters)` | `GET /api/mess/{id}/menu/` | Menu items with meal_type/day filters |
| `useBookExtras()` | `POST /api/mess/extras/book/` | Book extras mutation |
| `useMyBookings()` | `GET /api/mess/bookings/` | Student's bookings |
| `useBookingDetail(id)` | `GET /api/mess/bookings/{id}/` | Booking detail |
| `useCancelBooking(id)` | `POST /api/mess/bookings/{id}/cancel/` | Cancel booking mutation |
| `useMessAccount()` | `GET /api/users/me/mess-account/` | Mess account balance |
| `useManagerMenu()` | `GET/POST /api/mess/manager/menu/` | Manager menu CRUD |
| `useManagerBookings()` | `GET /api/mess/manager/bookings/` | Today's bookings |
| `useManagerInventory()` | `GET/PATCH /api/mess/manager/inventory/` | Inventory management |
| `useManagerStats()` | `GET /api/mess/manager/stats/` | Booking stats |
| `useVerifyQR()` | `POST /api/mess/worker/verify/` | Verify QR mutation |
| `useScanHistory()` | `GET /api/mess/worker/scan-history/` | Scan history |

#### 7. Routes (`features/mess/routes.jsx`)

| Route | Component | Access |
|-------|-----------|--------|
| `/mess` | `MessListPage` | All authenticated users |
| `/mess/:messId/menu` | `MessMenuPage` | All authenticated users |
| `/mess/bookings` | `MyBookingsPage` | Students |
| `/mess/bookings/:id` | `BookingDetailPage` | Students |
| `/manager/mess/menu` | `ManagerMenuPage` | Mess Manager |
| `/manager/mess/bookings` | `ManagerBookingsPage` | Mess Manager |
| `/manager/mess/inventory` | `ManagerInventoryPage` | Mess Manager |
| `/manager/mess/stats` | `ManagerStatsPage` | Mess Manager |
| `/worker/scan` | `QRScannerPage` | Mess Worker |
| `/worker/history` | `ScanHistoryPage` | Mess Worker |

### Files created

```
features/mess/
├── routes.jsx
├── pages/
│   ├── MessListPage.jsx
│   ├── MessMenuPage.jsx
│   ├── MyBookingsPage.jsx
│   ├── BookingDetailPage.jsx
│   ├── ManagerMenuPage.jsx
│   ├── ManagerBookingsPage.jsx
│   ├── ManagerInventoryPage.jsx
│   ├── ManagerStatsPage.jsx
│   ├── QRScannerPage.jsx
│   └── ScanHistoryPage.jsx
├── components/
│   ├── MenuItemCard.jsx
│   ├── ExtrasBookingModal.jsx
│   ├── QRCodeDisplay.jsx
│   ├── CancelBookingButton.jsx
│   ├── MessAccountCard.jsx
│   ├── MessAccountHistory.jsx
│   ├── VerificationResult.jsx
│   └── MessCard.jsx
└── hooks/
    ├── useMessList.js
    ├── useMessMenu.js
    ├── useBookExtras.js
    ├── useMyBookings.js
    ├── useBookingDetail.js
    ├── useCancelBooking.js
    ├── useMessAccount.js
    ├── useManagerMenu.js
    ├── useManagerBookings.js
    ├── useManagerInventory.js
    ├── useManagerStats.js
    ├── useVerifyQR.js
    └── useScanHistory.js
```

### SRS Requirements Covered
F2.1 – F2.9 (Student Mess Features UI), F5.1 – F5.6 (Mess Manager UI), F6.1 – F6.9 (Mess Worker / QR Scanner UI)

---

## Person D — Settings, User Profile, Notifications & Shared Infrastructure

**Feature directory owned**: `features/settings/`
**Also owns**: `app/`, `components/ui/`, `components/layout/`, `hooks/`, `lib/`, `stores/` (base files), `styles/`

### What to build

#### 1. User Profile Screens

| Screen / Component | Description |
|---------------------|-------------|
| `ProfilePage.jsx` | View & edit profile — shows user info (name, email, phone, role), student details (roll number, hostel, room number) or staff details. Uses react-hook-form + Zod for validation. |
| `ProfileAvatar.jsx` | Avatar display and upload component with image cropping. |
| `MessAccountSection.jsx` | Embeds Person C's `MessAccountCard` + `MessAccountHistory` if user is a student. |

#### 2. Settings Screens

| Screen / Component | Description |
|---------------------|-------------|
| `SettingsPage.jsx` | Settings hub — navigation to sub-settings (Notifications, Theme, About). |
| `NotificationSettings.jsx` | Toggle push notifications on/off, manage notification preferences (order updates, crowd alerts, delivery updates). |
| `ThemeSettings.jsx` | Light / Dark / System theme toggle (Tailwind dark mode). Persists to `localStorage`. |
| `ChangePasswordPage.jsx` | Current password + new password form. Uses `/api/auth/reset-password/` endpoint. |
| `AboutPage.jsx` | App version, team credits, links to terms & privacy policy. |

#### 3. Notification Center

| Screen / Component | Description |
|---------------------|-------------|
| `NotificationBell.jsx` | Navbar bell icon with unread count badge. Opens `NotificationDrawer`. |
| `NotificationDrawer.jsx` | Slide-out panel listing recent notifications — grouped by date. Mark as read on click. "Mark all read" button. |
| `NotificationItem.jsx` | Single notification row — icon by type, title, body, timestamp, read/unread visual. Clicking navigates to relevant screen (e.g., order detail). |
| `NotificationPage.jsx` | Full-page notification history (for mobile breakpoint where drawer isn't ideal). |

#### 4. Delivery Coordinator Screens

| Screen / Component | Description |
|---------------------|-------------|
| `DeliveryDashboard.jsx` | Main delivery person home — availability toggle (online/offline), list of available orders to accept. |
| `DeliveryOrderCard.jsx` | Card for each available delivery — canteen name, pickup location, delivery address, estimated fee. Accept button. |
| `ActiveDeliveryPage.jsx` | Currently active delivery — order details, canteen pickup info, customer address, status update buttons (Picked Up → In Transit → Delivered). Optional photo proof upload. |
| `DeliveryHistoryPage.jsx` | Past deliveries with earnings summary. |
| `DeliveryEarningsPage.jsx` | Today's earnings breakdown and history chart. |

#### 5. React Query Hooks (`features/settings/hooks/`)

| Hook | Endpoint | Description |
|------|----------|-------------|
| `useProfile()` | `GET /api/users/me/` | Fetch current user profile |
| `useUpdateProfile()` | `PATCH /api/users/me/` | Update profile mutation |
| `useNotifications()` | `GET /api/notifications/` | Fetch notifications |
| `useMarkRead()` | `POST /api/notifications/read/` | Mark as read mutation |
| `useRegisterDevice()` | `POST /api/notifications/register-device/` | Register FCM token |
| `useDeliveryStatus()` | `GET/PATCH /api/delivery/status/` | Get/toggle availability |
| `useAvailableDeliveries()` | `GET /api/delivery/available-orders/` | Available orders |
| `useAcceptDelivery(id)` | `POST /api/delivery/orders/{id}/accept/` | Accept delivery |
| `useUpdateDelivery(id)` | `POST /api/delivery/orders/{id}/...` | Update delivery status |
| `useDeliveryHistory()` | `GET /api/delivery/history/` | Past deliveries |
| `useDeliveryEarnings()` | `GET /api/delivery/earnings/` | Earnings |

#### 6. Shared Infrastructure (owned by Person D)

| Item | Description |
|------|-------------|
| `lib/api.js` | Axios instance with base URL, JWT interceptors (attach access token, auto-refresh on 401), error handling. |
| `lib/queryKeys.js` | React Query key factory — e.g., `queryKeys.canteen.menu(id)` — ensures consistent cache keys across all features. |
| `lib/constants.js` | Shared constants: API base URL, WebSocket URL, order statuses, user roles. |
| `lib/utils.js` | Helper functions: `formatCurrency()`, `formatDate()`, `getInitials()`, `cn()` (clsx + tailwind-merge). |
| `hooks/useAuth.js` | Auth hook: `user`, `isAuthenticated`, `login()`, `logout()`, `hasRole()`. Wraps `authStore`. |
| `hooks/useWebSocket.js` | Generic WebSocket hook with auto-reconnect, exponential backoff, event handler registration. |
| `hooks/useMediaQuery.js` | Responsive breakpoint hook. |
| `stores/notificationStore.js` | Zustand store for unread notification count+list, used by `NotificationBell`. |
| `components/ui/*` | Design system primitives: Button, Card, Modal, Input, Select, Badge, Skeleton, Tabs, Avatar, Dropdown, Toast wrapper, etc. |
| `components/layout/*` | Navbar (with notification bell, profile avatar), BottomNav (mobile), Sidebar (manager/worker views), PageWrapper. |
| `app/Router.jsx` | Central React Router setup — imports routes from each person's `features/<name>/routes.jsx`. Role-based route guards (`RequireAuth`, `RequireRole`). |
| `app/Providers.jsx` | Wraps app with `QueryClientProvider`, `BrowserRouter`, `Toaster`, theme provider. |
| `tailwind.config.js` | Tailwind theme customization: brand colors, fonts, border radius tokens, dark mode config. |

#### 7. Routes (`features/settings/routes.jsx`)

| Route | Component | Access |
|-------|-----------|--------|
| `/profile` | `ProfilePage` | All authenticated users |
| `/settings` | `SettingsPage` | All authenticated users |
| `/settings/notifications` | `NotificationSettings` | All authenticated users |
| `/settings/theme` | `ThemeSettings` | All authenticated users |
| `/settings/change-password` | `ChangePasswordPage` | All authenticated users |
| `/settings/about` | `AboutPage` | All authenticated users |
| `/notifications` | `NotificationPage` | All authenticated users |
| `/delivery` | `DeliveryDashboard` | Delivery Coordinator |
| `/delivery/active` | `ActiveDeliveryPage` | Delivery Coordinator |
| `/delivery/history` | `DeliveryHistoryPage` | Delivery Coordinator |
| `/delivery/earnings` | `DeliveryEarningsPage` | Delivery Coordinator |

### Files created

```
features/settings/
├── routes.jsx
├── pages/
│   ├── ProfilePage.jsx
│   ├── SettingsPage.jsx
│   ├── NotificationSettings.jsx
│   ├── ThemeSettings.jsx
│   ├── ChangePasswordPage.jsx
│   ├── AboutPage.jsx
│   ├── NotificationPage.jsx
│   ├── DeliveryDashboard.jsx
│   ├── ActiveDeliveryPage.jsx
│   ├── DeliveryHistoryPage.jsx
│   └── DeliveryEarningsPage.jsx
├── components/
│   ├── ProfileAvatar.jsx
│   ├── MessAccountSection.jsx
│   ├── NotificationBell.jsx
│   ├── NotificationDrawer.jsx
│   ├── NotificationItem.jsx
│   ├── DeliveryOrderCard.jsx
│   └── DeliveryStatusToggle.jsx
└── hooks/
    ├── useProfile.js
    ├── useUpdateProfile.js
    ├── useNotifications.js
    ├── useMarkRead.js
    ├── useRegisterDevice.js
    ├── useDeliveryStatus.js
    ├── useAvailableDeliveries.js
    ├── useAcceptDelivery.js
    ├── useUpdateDelivery.js
    ├── useDeliveryHistory.js
    └── useDeliveryEarnings.js

# Shared infrastructure (also owned by Person D)
app/
├── App.jsx
├── Router.jsx
└── Providers.jsx

components/
├── ui/
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Modal.jsx
│   ├── Input.jsx
│   ├── Select.jsx
│   ├── Badge.jsx
│   ├── Skeleton.jsx
│   ├── Tabs.jsx
│   ├── Avatar.jsx
│   ├── Dropdown.jsx
│   └── ...
└── layout/
    ├── Navbar.jsx
    ├── BottomNav.jsx
    ├── Sidebar.jsx
    └── PageWrapper.jsx

hooks/
├── useAuth.js
├── useWebSocket.js
└── useMediaQuery.js

lib/
├── api.js
├── constants.js
├── utils.js
└── queryKeys.js

stores/
└── notificationStore.js

styles/
└── index.css
```

### SRS Requirements Covered
F1.5 – F1.8 (User Profile), F8.1 – F8.10 (Delivery Coordinator UI), F9.1 – F9.6 (Notifications UI), Shared infrastructure

---

## How Each Person Can Visually Test Their Work

| Person | Testing Approach |
|--------|-----------------|
| **All** | `npm run dev` — Vite dev server with HMR. Navigate to your feature routes. |
| **A** | Mock WebSocket data with `setTimeout` or a local mock server. Use Recharts with hardcoded data initially. |
| **B** | Use React Query DevTools (`@tanstack/react-query-devtools`) to inspect cache. Test Razorpay with test mode keys. Use `cartStore` with localStorage — test the cart independently. |
| **C** | Use a QR code rendering library preview. Test QR scanner with phone camera (Vite supports HTTPS for local network testing). |
| **D** | Build `components/ui/` with a Storybook-like demo page (`/dev/components`). Test FCM with a test device token. |

> **Tip**: Use MSW (Mock Service Worker) to mock API responses during development — this lets each person work independently before the backend is ready.

---

## Summary Table

| Person | Feature Directory | Key Responsibilities | SRS Reqs |
|--------|------------------|---------------------|----------|
| **A** | `features/ml/` | Crowd monitoring dashboard (student + manager), live density display, crowd analytics charts, WebSocket for real-time density updates | F3.1–F3.8 |
| **B** | `features/canteen/` | Canteen browsing, menu display, cart & checkout, Razorpay payment integration, order tracking with real-time status, canteen manager order/menu management | F4.1–F4.13, F7.1–F7.11 |
| **C** | `features/mess/` | Mess menu browsing, extras booking, QR code display & scanner, booking management, mess manager/worker screens, mess account widget | F2.1–F2.9, F5.1–F5.6, F6.1–F6.9 |
| **D** | `features/settings/` + shared infra | User profile, settings, notifications center, delivery coordinator screens, **all** shared infrastructure (routing, UI components, layout, API client, hooks, stores, theme) | F1.5–F1.8, F8.1–F8.10, F9.1–F9.6 |
