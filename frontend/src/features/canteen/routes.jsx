import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* Pages */
import CanteenListPage from "./pages/CanteenListPage";
import CanteenDetailPage from "./pages/CanteenDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ManagerOrdersPage from "./pages/ManagerOrdersPage";
import ManagerOrderDetail from "./pages/ManagerOrderDetail";
import ManagerMenuPage from "./pages/ManagerMenuPage";
import ManagerStatsPage from "./pages/ManagerStatsPage";

/* Components */
import CartDrawer from "./components/CartDrawer";
import MenuSearch from "./components/MenuSearch";

/* Mock auth hook (replace with real one) */
const useAuth = () => {
  return {
    isAuthenticated: true,
    role: "student", // change to "manager" for testing
  };
};

/* Protected Route */
const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, role: userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/canteens" />;
  }

  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authenticated */}
        <Route
          path="/canteens"
          element={
            <ProtectedRoute>
              <CanteenListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/canteens/:id"
          element={
            <ProtectedRoute>
              <CanteenDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/canteens/search"
          element={
            <ProtectedRoute>
              <MenuSearch />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute role="student">
              <CartDrawer open />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute role="student">
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute role="student">
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute role="student">
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager/canteen/orders"
          element={
            <ProtectedRoute role="manager">
              <ManagerOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/canteen/orders/:id"
          element={
            <ProtectedRoute role="manager">
              <ManagerOrderDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/canteen/menu"
          element={
            <ProtectedRoute role="manager">
              <ManagerMenuPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/canteen/stats"
          element={
            <ProtectedRoute role="manager">
              <ManagerStatsPage />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route
          path="*"
          element={<Navigate to="/canteens" />}
        />
      </Routes>
    </BrowserRouter>
  );
}