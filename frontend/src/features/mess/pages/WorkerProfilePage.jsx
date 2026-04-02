import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, User } from 'lucide-react';

const WorkerProfilePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Do you want to logout?')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      navigate('/auth');
    }
  };

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => navigate('/worker/scan')}
            style={{ width: 36, height: 36, background: 'var(--st-light-gray)', border: '1px solid var(--st-border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="mess-page-title">Worker Profile</h1>
        </div>
      </div>

      <div className="mess-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--st-gray)', padding: 20, borderRadius: 16, border: '1px solid var(--st-border)' }}>
          <div style={{ width: 64, height: 64, background: 'var(--st-light-gray)', borderRadius: 16, border: '2px solid var(--st-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            <User size={32} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Mess Worker Account</h2>
            <p style={{ fontSize: 13, color: 'var(--st-text-dim)' }}>Scan Verification Access</p>
          </div>
        </div>

        <div>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%', padding: 18, background: 'var(--st-gray)', border: '1px solid var(--st-border)', 
              borderRadius: 16, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.2s', marginTop: 16
            }}
          >
            <LogOut size={20} color="var(--st-red)" />
            <span style={{ color: 'var(--st-red)' }}>Log Out from Worker</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfilePage;
