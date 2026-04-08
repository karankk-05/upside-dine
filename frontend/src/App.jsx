import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthPage from './features/auth/pages/AuthPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import MessManagerDashboard from './pages/MessManagerDashboard';
import CanteenManagerDashboard from './pages/CanteenManagerDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import { mlRoutes } from './features/ml/routes';
import AdminManagerDashboard from './pages/AdminManagerDashboard';
import ProfilePage from './pages/ProfilePage';
import messRoutes from './features/mess/routes';
import canteenRoutes from './features/canteen/routes';
import './App.css';
import { AuthLanding, ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const protectRouteElements = (routeElements) =>
  React.Children.map(routeElements, (route) => {
    if (!React.isValidElement(route)) {
      return route;
    }

    return React.cloneElement(route, {
      element: <ProtectedRoute>{route.props.element}</ProtectedRoute>,
    });
  });

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<AuthLanding />} />
          <Route
            path="/auth"
            element={
              <PublicOnlyRoute>
                <AuthPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/manager/mess" element={<ProtectedRoute><MessManagerDashboard /></ProtectedRoute>} />
          <Route path="/manager/canteen" element={<ProtectedRoute><CanteenManagerDashboard /></ProtectedRoute>} />
          <Route path="/delivery" element={<ProtectedRoute><DeliveryDashboard /></ProtectedRoute>} />
          <Route path="/manager/admin" element={<ProtectedRoute><AdminManagerDashboard /></ProtectedRoute>} />
          <Route path="/admin/managers" element={<Navigate to="/manager/admin" replace />} />
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
