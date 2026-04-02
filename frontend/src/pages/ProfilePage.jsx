import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import MessAccountCard from '../features/mess/components/MessAccountCard';

const ProfilePage = () => {
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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <div style={{ maxWidth: 428, margin: '0 auto', minHeight: '100vh', background: '#000', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ padding: '40px 20px 20px 20px', background: 'var(--st-darker)', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--st-border)' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ width: 36, height: 36, background: 'var(--st-gray)', border: '1px solid var(--st-border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Profile</h1>
        </div>

        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Profile details placeholder (could fetch from /users/me later) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--st-gray)', padding: 20, borderRadius: 16, border: '1px solid var(--st-border)' }}>
            <div style={{ width: 64, height: 64, background: 'var(--st-light-gray)', borderRadius: 16, border: '2px solid var(--st-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              <User size={32} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Student Account</h2>
              <p style={{ fontSize: 13, color: 'var(--st-text-dim)' }}>Manage your dining settings</p>
            </div>
          </div>

          {/* Mess Account Details */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Dining Tab</h3>
            <MessAccountCard />
          </div>

          {/* Options */}
          <div style={{ marginTop: 'auto' }}>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%', padding: 18, background: 'var(--st-gray)', border: '1px solid var(--st-border)', 
                borderRadius: 16, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.2s'
              }}
            >
              <LogOut size={20} color="var(--st-red)" />
              <span style={{ color: 'var(--st-red)' }}>Log Out</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
