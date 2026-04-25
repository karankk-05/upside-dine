# Frontend -- React 18 PWA

The frontend is a **React 18** single-page application built with **Vite 5** and **TailwindCSS**, designed as a mobile-first Progressive Web App. It serves 6 distinct role-based dashboards within a single codebase, with each dashboard tailored to its user's workflow.

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Styling | TailwindCSS 3.4 |
| State Management | Zustand 4.5 |
| Server State | TanStack React Query 5 |
| Routing | React Router 6 |
| Animations | Framer Motion 11 |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts 2.10 |
| QR Scanning | html5-qrcode, jsQR |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Mobile | Capacitor (Android APK) |
| Testing | Vitest, React Testing Library |
| Linting | ESLint, Prettier |

---

## Role-Based Dashboards

The application dynamically routes users to their role-specific dashboard after authentication:

### Student Dashboard (`/dashboard`)
- Personalized home with greeting, search, and top food items
- Quick access cards for assigned mess, canteen listings
- Bottom navigation: Home, Orders, Favorites, Profile

### Mess Manager (`/manager/mess`)
- Meal period selector (Breakfast, Lunch, Dinner)
- Extras inventory management (add, edit, quantity tracking)
- Recent bookings overview with status indicators
- Bottom navigation: Dashboard, Inventory, Bookings, Settings

### Canteen Manager (`/manager/canteen`)
- Today's overview (total orders, revenue, active orders, rating)
- Active order queue with status filters (All, Pickup, Delivery)
- Order state management (Accept -> Preparing -> Ready)
- Delivery coordinator assignment
- Bottom navigation: Dashboard, Orders, Menu, Settings

### Delivery Coordinator (`/delivery`)
- Online/offline toggle with status indicator
- Daily stats (deliveries completed, earnings)
- Current active delivery with pickup/deliver-to details
- Available orders queue
- Bottom navigation: Home, Orders, Earnings, Profile

### Mess Worker (QR Scanner)
- Camera-based QR code scanner
- Manual booking ID entry fallback
- One-tap booking verification
- Recent scans history with valid/redeemed status

### Admin Manager (`/manager/admin`)
- Create and manage mess/canteen entities
- Create manager accounts with employee codes
- System-wide overview

---

## Feature Modules

The `src/features/` directory contains self-contained feature modules:

### `features/auth`
- Login page with Student/Admin role toggle
- Registration with OTP verification flow
- Forgot password flow
- JWT token management (storage, refresh, interceptors)

### `features/mess`
- Student mess view (book food, live crowd, monthly account)
- Book extras page (today's menu, one-tap booking)
- QR code display with countdown timer
- My bookings list with status tracking
- Mess manager CRUD for menus and extras

### `features/canteen`
- Canteen discovery and search
- Menu browsing with categories
- Cart management (add, remove, quantity)
- Checkout with delivery address and payment
- Order history and live status tracking

### `features/ml`
- Live crowd monitor display
- Crowd density percentage and wait time cards
- Today's crowd pattern chart (hourly bar graph)
- Best time recommendation

---

## State Management

### Zustand Stores (`src/stores/`)
- **Auth store**: User session, tokens, role, login/logout actions
- **Cart store**: Canteen cart items, quantities, totals

### React Query (`src/lib/`)
- Server state caching and synchronization
- Automatic background refetching
- Optimistic updates for order status changes
- Custom `appQueryClient` with configured defaults

---

## API Integration

All API calls go through a configured Axios instance (`src/lib/`) that:
- Automatically attaches the JWT Bearer token from Zustand auth store
- Handles 401 responses with token refresh or redirect to login
- Uses React Query for server state with cache invalidation

In Docker, the Vite dev server proxies `/api` requests to the backend container:
```javascript
proxy: {
  '/api': {
    target: 'http://backend:8000',
    changeOrigin: true,
  },
}
```

---

## Route Protection

Routes are protected using `ProtectedRoute` and `PublicOnlyRoute` guard components:

```
/                     -> Auth landing (redirect based on role)
/auth                 -> Login/Register (public only)
/dashboard            -> Student dashboard (authenticated)
/manager/mess         -> Mess Manager (mess_manager role)
/manager/canteen      -> Canteen Manager (canteen_manager role)
/delivery             -> Delivery Coordinator (delivery_person role)
/manager/admin        -> Admin (admin_manager role)
```

Each route checks the user's role from the JWT token and redirects unauthorized users.

---

## Capacitor (Android)

The app is wrapped with Capacitor for native Android distribution:

```json
{
  "appId": "com.upsidedine.app",
  "appName": "UpsideDine",
  "webDir": "dist"
}
```

Build the APK:
```bash
npm run build
npx cap sync android
npx cap open android   # Opens in Android Studio
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:8000/ws` |
| `VITE_ENV` | Environment name | `development` |

---

## Local Development

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server (port 3000)
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format

# Production build
npm run build
```

---

## Directory Structure

```
frontend/
|-- public/                   # Static assets
|-- src/
|   |-- features/
|   |   |-- auth/             # Login, register, OTP pages
|   |   |-- mess/             # Mess booking, QR, manager views
|   |   |-- canteen/          # Menu, cart, checkout, orders
|   |   |-- ml/               # Crowd monitoring UI
|   |   |-- settings/         # User settings
|   |-- pages/
|   |   |-- StudentDashboard.jsx
|   |   |-- MessManagerDashboard.jsx
|   |   |-- CanteenManagerDashboard.jsx
|   |   |-- DeliveryDashboard.jsx
|   |   |-- AdminManagerDashboard.jsx
|   |   |-- ProfilePage.jsx
|   |-- components/           # Shared UI (NavLayout, RouteGuards, etc.)
|   |-- stores/               # Zustand state stores
|   |-- hooks/                # Custom React hooks
|   |-- lib/                  # API client, query client config
|   |-- styles/               # Global styles
|   |-- App.jsx               # Root component with routing
|   |-- main.jsx              # Entry point
|-- android/                  # Capacitor Android project
|-- vite.config.js
|-- package.json
|-- Dockerfile
`-- .env.example
```
