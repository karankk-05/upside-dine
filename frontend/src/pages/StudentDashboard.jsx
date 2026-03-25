import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ClipboardList, Wallet } from 'lucide-react';
import MessAccountCard from '../features/mess/components/MessAccountCard';
import '../features/mess/mess.css';

const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <h1 className="mess-page-title">Student Dashboard</h1>
      </div>

      <div className="mess-content">
        <MessAccountCard />

        <div className="mess-feature-cards">
          <div className="mess-feature-card" onClick={() => navigate('/mess')} id="dashboard-mess">
            <div className="mess-feature-header">
              <div className="mess-feature-icon"><UtensilsCrossed size={22} /></div>
              <h2 className="mess-feature-title">Mess</h2>
            </div>
            <p className="mess-feature-description">Browse mess halls, view menus, and book extras.</p>
          </div>

          <div className="mess-feature-card" onClick={() => navigate('/mess/bookings')} id="dashboard-bookings">
            <div className="mess-feature-header">
              <div className="mess-feature-icon"><ClipboardList size={22} /></div>
              <h2 className="mess-feature-title">My Bookings</h2>
            </div>
            <p className="mess-feature-description">View your bookings, QR codes, and booking history.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
