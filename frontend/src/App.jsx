import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './features/auth/pages/AuthPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import MessManagerDashboard from './pages/MessManagerDashboard';
import CanteenManagerDashboard from './pages/CanteenManagerDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
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
      </Routes>
    </Router>
  );
}

export default App;
