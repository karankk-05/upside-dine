import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../features/mess/mess.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [canteens, setCanteens] = useState([]);
  const [mess, setMess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch user profile + canteens + mess in parallel
    Promise.all([
      axios.get('/api/users/me/', { headers }),
      axios.get('/api/public/canteens/'),
      axios.get('/api/mess/', { headers }),
    ])
      .then(([userRes, canteenRes, messRes]) => {
        const profile = userRes.data.profile;
        setUserName(profile?.full_name || userRes.data.email.split('@')[0]);
        setHostelName(profile?.hostel_name || '');

        setCanteens(canteenRes.data || []);

        // Find the student's own mess based on hostel_name
        const messes = messRes.data || [];
        const studentHostel = profile?.hostel_name || '';
        const myMess = messes.find(
          (m) => m.hall_name?.toLowerCase() === studentHostel.toLowerCase()
        );
        setMess(myMess || messes[0] || null);
      })
      .catch((err) => {
        console.error('Dashboard load error:', err);
        if (err.response?.status === 401) navigate('/auth');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const canteenEmojis = ['🍕', '🍔', '🥡', '☕', '🍜', '🧁', '🥪', '🍩'];

  // Filter canteens & mess by search
  const q = searchQuery.toLowerCase();
  const filteredCanteens = canteens.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q)
  ).sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const isAHall = aName.includes('hall') || aName.includes('gh1') || aName.includes('ght2');
    const isBHall = bName.includes('hall') || bName.includes('gh1') || bName.includes('ght2');
    if (isAHall && !isBHall) return 1;
    if (!isAHall && isBHall) return -1;
    return aName.localeCompare(bName);
  });
  const showMess =
    mess && (mess.name?.toLowerCase().includes(q) || mess.hall_name?.toLowerCase().includes(q) || !q);

  // Logout is now handled in ProfilePage

  if (loading) {
    return (
      <div className="mess-page">
        <div className="mess-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="mess-loading">
            <div className="mess-loading-spinner" />
            <span className="mess-loading-text">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <div style={{ maxWidth: 428, margin: '0 auto', minHeight: '100vh', background: '#000', position: 'relative' }}>

        {/* Header */}
        <div style={{ padding: '40px 20px 0 20px', background: 'linear-gradient(180deg, #000 0%, #0a0a0a 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{
                fontSize: 24, fontWeight: 700, color: '#d55555',
                textShadow: '0 0 4px rgba(232,85,85,0.12), 0 0 8px rgba(232,85,85,0.12)',
              }}>
                Hey, {userName}!
              </h1>
              <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>What would you like to eat today?</p>
            </div>
            <div
              onClick={() => navigate('/profile')}
              style={{
                width: 40, height: 40, background: '#2a2a2a', border: '2px solid #d55555',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 0 10px rgba(232,85,85,0.12)', fontSize: 20,
              }}
            >
              👤
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Search for food, canteens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '14px 44px 14px 16px', background: '#1a1a1a',
                border: '1px solid #333', borderRadius: 12, color: '#fff', fontSize: 14,
                outline: 'none',
              }}
              id="dashboard-search"
            />
            <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>🔍</span>
          </div>
        </div>

        {/* Mess Section */}
        {showMess && mess && (
          <div style={{ padding: '24px 20px 0 20px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{mess.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Book Extras Option */}
              <div
                onClick={() => navigate(`/mess/${mess.id}/menu`)}
                style={{
                  background: '#1a1a1a', border: '1px solid #d55555', borderRadius: 16,
                  padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(232,85,85,0.12)', transition: 'transform 0.2s', aspectRatio: '1/1',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>🍽️</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, textAlign: 'center' }}>Book Extras</h3>
                <div style={{ fontSize: 11, color: '#00ff00', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: '#00ff00', borderRadius: '50%', boxShadow: '0 0 6px #00ff00' }} />
                  Available Now
                </div>
              </div>

              {/* Crowd Density Option */}
              <div
                onClick={() => navigate('/crowd/mess/' + mess.id)}
                style={{
                  background: '#1a1a1a', border: '1px solid #333', borderRadius: 16,
                  padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'transform 0.2s', aspectRatio: '1/1',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, textAlign: 'center' }}>Crowd Density</h3>
                <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>Live View</div>
              </div>
            </div>
          </div>
        )}

        {/* Canteens Section */}
        <div style={{ padding: '24px 20px 120px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Canteens</h2>
            <a onClick={(e) => { e.preventDefault(); navigate('/canteens'); }}
              href="#" style={{ color: '#d55555', fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
              See All
            </a>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {filteredCanteens.map((canteen, idx) => (
              <div
                key={canteen.id}
                onClick={() => navigate(`/canteens/${canteen.id}`)}
                style={{
                  background: '#1a1a1a', border: '1px solid #333', borderRadius: 16,
                  padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'transform 0.2s', aspectRatio: '4/5', textAlign: 'center',
                }}
              >
                <div style={{
                  width: 56, height: 56, background: '#2a2a2a', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 12,
                }}>
                  {canteenEmojis[idx % canteenEmojis.length]}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{canteen.name}</h3>
                <div style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: '#00ff00', borderRadius: '50%', boxShadow: '0 0 6px #00ff00' }} />
                  {canteen.location || 'Open Now'}
                </div>
              </div>
            ))}

            {filteredCanteens.length === 0 && (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: 40 }}>No canteens found.</p>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          maxWidth: 428, width: '100%', background: '#000', borderTop: '1px solid #333',
          display: 'flex', justifyContent: 'space-around', padding: '12px 0', zIndex: 100,
        }}>
          <a href="/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#d55555', textDecoration: 'none', fontSize: 11, padding: '8px 20px' }}
            id="nav-home">
            <span style={{ fontSize: 24 }}>🏠</span>Home
          </a>
          <a onClick={(e) => { e.preventDefault(); navigate('/orders'); }}
            href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#999', textDecoration: 'none', fontSize: 11, padding: '8px 20px', cursor: 'pointer' }}
            id="nav-orders">
            <span style={{ fontSize: 24 }}>📦</span>Orders
          </a>
          <a onClick={(e) => { e.preventDefault(); navigate('/mess/bookings'); }}
            href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#999', textDecoration: 'none', fontSize: 11, padding: '8px 20px', cursor: 'pointer' }}
            id="nav-bookings">
            <span style={{ fontSize: 24 }}>🍽️</span>Mess
          </a>
          <a href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#999', textDecoration: 'none', fontSize: 11, padding: '8px 20px', cursor: 'pointer' }}
            onClick={(e) => { e.preventDefault(); navigate('/profile'); }}
            id="nav-profile">
            <span style={{ fontSize: 24 }}>👤</span>Profile
          </a>
        </nav>
      </div>
    </div>
  );
};

export default StudentDashboard;
