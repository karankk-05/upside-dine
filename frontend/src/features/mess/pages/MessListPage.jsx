import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed, ClipboardList } from 'lucide-react';
import { useMessList } from '../hooks/useMessList';
import MessAccountCard from '../components/MessAccountCard';
import '../mess.css';

const MessListPage = () => {
  const navigate = useNavigate();
  const { data: messes, isLoading, isError } = useMessList();

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="mess-page-title">Student Mess</h1>
      </div>

      <div className="mess-content">
        <MessAccountCard />

        <div className="mess-feature-cards">
          {isLoading ? (
            <div className="mess-loading">
              <div className="mess-loading-spinner" />
              <span className="mess-loading-text">Loading messes...</span>
            </div>
          ) : isError ? (
            <div className="mess-error">Failed to load mess halls. Please try again.</div>
          ) : (
            <>
              {(messes || []).map((mess) => (
                <div key={mess.id} className="mess-feature-card" onClick={() => navigate(`/mess/${mess.id}/menu`)} id={`mess-feature-${mess.id}`}>
                  <div className="mess-feature-header">
                    <div className="mess-feature-icon"><UtensilsCrossed size={22} /></div>
                    <h2 className="mess-feature-title">{mess.name}</h2>
                  </div>
                  <p className="mess-feature-description">
                    {mess.hall_name} — {mess.location}
                    <br />
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <span className={`mess-status-dot ${mess.is_active ? 'active' : 'inactive'}`} />
                      {mess.is_active ? 'Currently Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              ))}

              <div className="mess-feature-card" onClick={() => navigate('/mess/bookings')} id="mess-feature-bookings">
                <div className="mess-feature-header">
                  <div className="mess-feature-icon"><ClipboardList size={22} /></div>
                  <h2 className="mess-feature-title">My Bookings</h2>
                </div>
                <p className="mess-feature-description">View and manage your mess bookings, QR codes, and booking history.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessListPage;
