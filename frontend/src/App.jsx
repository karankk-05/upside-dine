import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './features/auth/pages/AuthPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import MessManagerDashboard from './pages/MessManagerDashboard';
import CanteenManagerDashboard from './pages/CanteenManagerDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';

// Mess Pages
import MessListPage from './features/mess/pages/MessListPage';
import MessMenuPage from './features/mess/pages/MessMenuPage';
import MyBookingsPage from './features/mess/pages/MyBookingsPage';
import BookingDetailPage from './features/mess/pages/BookingDetailPage';
import ManagerMenuPage from './features/mess/pages/ManagerMenuPage';
import ManagerBookingsPage from './features/mess/pages/ManagerBookingsPage';
import ManagerInventoryPage from './features/mess/pages/ManagerInventoryPage';
import ManagerStatsPage from './features/mess/pages/ManagerStatsPage';
import QRScannerPage from './features/mess/pages/QRScannerPage';
import ScanHistoryPage from './features/mess/pages/ScanHistoryPage';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/manager/mess" element={<MessManagerDashboard />} />
        <Route path="/manager/canteen" element={<CanteenManagerDashboard />} />
        <Route path="/delivery" element={<DeliveryDashboard />} />
        
        {/* Student Mess Routes */}
        <Route path="/mess" element={<MessListPage />} />
        <Route path="/mess/:messId/menu" element={<MessMenuPage />} />
        <Route path="/mess/bookings" element={<MyBookingsPage />} />
        <Route path="/mess/bookings/:id" element={<BookingDetailPage />} />

        {/* Manager Mess Routes */}
        <Route path="/manager/mess/menu" element={<ManagerMenuPage />} />
        <Route path="/manager/mess/bookings" element={<ManagerBookingsPage />} />
        <Route path="/manager/mess/inventory" element={<ManagerInventoryPage />} />
        <Route path="/manager/mess/stats" element={<ManagerStatsPage />} />

        {/* Worker Mess Routes */}
        <Route path="/worker/scan" element={<QRScannerPage />} />
        <Route path="/worker/history" element={<ScanHistoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
