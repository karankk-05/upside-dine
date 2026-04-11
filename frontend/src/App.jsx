import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { mlRoutes } from './features/ml/routes';
import messRoutes from './features/mess/routes';
import canteenRoutes from './features/canteen/routes';
import './App.css';
import { AuthLanding, ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import StudentBottomNavLayout from './components/StudentBottomNavLayout';
import { appQueryClient } from './lib/queryClient';

const AuthPage = React.lazy(() => import('./features/auth/pages/AuthPage'));
const ForgotPasswordPage = React.lazy(() => import('./features/auth/pages/ForgotPasswordPage'));
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const OrderHistoryPage = React.lazy(() => import('./features/canteen/pages/OrderHistoryPage'));
const MyBookingsPage = React.lazy(() => import('./features/mess/pages/MyBookingsPage'));
const MessManagerDashboard = React.lazy(() => import('./pages/MessManagerDashboard'));
const CanteenManagerDashboard = React.lazy(() => import('./pages/CanteenManagerDashboard'));
const DeliveryDashboard = React.lazy(() => import('./pages/DeliveryDashboard'));
const AdminManagerDashboard = React.lazy(() => import('./pages/AdminManagerDashboard'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

const RouteFallback = () => (
  <div className="app-route-shell">
    <div className="app-route-frame">
      <div className="app-route-copy">
        <div className="ui-skeleton ui-skeleton-text" style={{ width: '48%', height: 28, marginBottom: 12 }} />
        <div className="ui-skeleton ui-skeleton-text" style={{ width: '72%', height: 14 }} />
      </div>
      <div className="app-route-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`route-skeleton-${index}`} className="ui-skeleton ui-skeleton-card app-route-card" />
        ))}
      </div>
    </div>
  </div>
);

const withSuspense = (element) => (
  <React.Suspense fallback={<RouteFallback />}>{element}</React.Suspense>
);

const MESS_MANAGER_ROLES = ['mess_manager'];
const MESS_WORKER_ROLES = ['mess_worker'];
const CANTEEN_MANAGER_ROLES = ['canteen_manager'];
const DELIVERY_ROLES = ['delivery_person'];
const ADMIN_ROLES = ['admin_manager', 'superadmin'];

const getAllowedRolesForPath = (path = '') => {
  if (path.startsWith('/manager/mess') || path.startsWith('/manager/crowd')) {
    return MESS_MANAGER_ROLES;
  }

  if (path.startsWith('/worker/')) {
    return MESS_WORKER_ROLES;
  }

  if (path.startsWith('/manager/canteen')) {
    return CANTEEN_MANAGER_ROLES;
  }

  return undefined;
};

const protectRouteElements = (routeElements) =>
  React.Children.map(routeElements, (route) => {
    if (!React.isValidElement(route)) {
      return route;
    }

    return React.cloneElement(route, {
      element: (
        <ProtectedRoute allowedRoles={getAllowedRolesForPath(route.props.path)}>
          {withSuspense(route.props.element)}
        </ProtectedRoute>
      ),
    });
  });

function App() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<AuthLanding />} />
          <Route
            path="/auth"
            element={
              <PublicOnlyRoute>
                {withSuspense(<AuthPage />)}
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={withSuspense(<ForgotPasswordPage />)} />
          <Route
            element={
              <ProtectedRoute>
                <StudentBottomNavLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={withSuspense(<StudentDashboard />)} />
            <Route path="/orders" element={withSuspense(<OrderHistoryPage />)} />
            <Route path="/mess/bookings" element={withSuspense(<MyBookingsPage />)} />
            <Route path="/profile" element={withSuspense(<ProfilePage />)} />
          </Route>
          <Route
            path="/manager/mess"
            element={
              <ProtectedRoute allowedRoles={MESS_MANAGER_ROLES}>
                {withSuspense(<MessManagerDashboard />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/canteen"
            element={
              <ProtectedRoute allowedRoles={CANTEEN_MANAGER_ROLES}>
                {withSuspense(<CanteenManagerDashboard />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery"
            element={
              <ProtectedRoute allowedRoles={DELIVERY_ROLES}>
                {withSuspense(<DeliveryDashboard />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/admin"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                {withSuspense(<AdminManagerDashboard />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/managers"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <Navigate to="/manager/admin" replace />
              </ProtectedRoute>
            }
          />
          {/* Mess feature routes (student, manager, worker) */}
          {protectRouteElements(messRoutes)}
          {/* Canteen feature routes (student, manager) */}
          {protectRouteElements(canteenRoutes)}
          {/* ML routes for crowd monitoring UI */}
          {protectRouteElements(mlRoutes.props.children)}
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
