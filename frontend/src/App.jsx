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
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/manager/mess" element={<MessManagerDashboard />} />
          <Route path="/manager/canteen" element={<CanteenManagerDashboard />} />
          <Route path="/delivery" element={<DeliveryDashboard />} />
          <Route path="/admin/managers" element={<AdminManagerDashboard />} />
          {/* Mess feature routes (student, manager, worker) */}
          {messRoutes}
          {/* ML routes for crowd monitoring UI */}
          {mlRoutes}
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

