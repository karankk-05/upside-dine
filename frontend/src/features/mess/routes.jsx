import { Route } from 'react-router-dom';
import MessListPage from './pages/MessListPage';
import MessMenuPage from './pages/MessMenuPage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import ManagerMenuPage from './pages/ManagerMenuPage';
import ManagerBookingsPage from './pages/ManagerBookingsPage';
import ManagerInventoryPage from './pages/ManagerInventoryPage';
import ManagerStatsPage from './pages/ManagerStatsPage';
import QRScannerPage from './pages/QRScannerPage';
import ScanHistoryPage from './pages/ScanHistoryPage';

const messRoutes = [
  /* Student Routes */
  <Route key="mess-list" path="/mess" element={<MessListPage />} />,
  <Route key="mess-menu" path="/mess/:messId/menu" element={<MessMenuPage />} />,
  <Route key="mess-bookings" path="/mess/bookings" element={<MyBookingsPage />} />,
  <Route key="mess-booking-detail" path="/mess/bookings/:id" element={<BookingDetailPage />} />,

  /* Manager Routes */
  <Route key="mgr-menu" path="/manager/mess/menu" element={<ManagerMenuPage />} />,
  <Route key="mgr-bookings" path="/manager/mess/bookings" element={<ManagerBookingsPage />} />,
  <Route key="mgr-inventory" path="/manager/mess/inventory" element={<ManagerInventoryPage />} />,
  <Route key="mgr-stats" path="/manager/mess/stats" element={<ManagerStatsPage />} />,

  /* Worker Routes */
  <Route key="worker-scan" path="/worker/scan" element={<QRScannerPage />} />,
  <Route key="worker-history" path="/worker/history" element={<ScanHistoryPage />} />,
];

export default messRoutes;
