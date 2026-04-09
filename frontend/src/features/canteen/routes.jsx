import { Route } from 'react-router-dom';
import CanteenListPage from './pages/CanteenListPage';
import CanteenDetailPage from './pages/CanteenDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ManagerOrdersPage from './pages/ManagerOrdersPage';
import ManagerOrderDetail from './pages/ManagerOrderDetail';
import ManagerMenuPage from './pages/ManagerMenuPage';
import ManagerStatsPage from './pages/ManagerStatsPage';

const canteenRoutes = [
  /* Student Routes */
  <Route key="canteen-list" path="/canteens" element={<CanteenListPage />} />,
  <Route key="canteen-detail" path="/canteens/:id" element={<CanteenDetailPage />} />,
  <Route key="canteen-checkout" path="/checkout" element={<CheckoutPage />} />,
  <Route key="canteen-order-detail" path="/orders/:id" element={<OrderDetailPage />} />,

  /* Manager Routes */
  <Route key="canteen-mgr-orders" path="/manager/canteen/orders" element={<ManagerOrdersPage />} />,
  <Route key="canteen-mgr-order-detail" path="/manager/canteen/orders/:id" element={<ManagerOrderDetail />} />,
  <Route key="canteen-mgr-menu" path="/manager/canteen/menu" element={<ManagerMenuPage />} />,
  <Route key="canteen-mgr-stats" path="/manager/canteen/stats" element={<ManagerStatsPage />} />,
];

export default canteenRoutes;
