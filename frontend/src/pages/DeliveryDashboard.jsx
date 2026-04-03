import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../features/canteen/canteen.css';

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('home');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [deliveryOtps, setDeliveryOtps] = useState({});
  const [otpErrors, setOtpErrors] = useState({});
  const [profile, setProfile] = useState(null);
  const [assignedPending, setAssignedPending] = useState([]);

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Only 2 API calls instead of 5+2
      const [availRes, allMyRes] = await Promise.all([
        axios.get('/api/delivery/available/', { headers }),
        axios.get('/api/delivery/orders/', { headers }),         // all my orders, no status filter
      ]);
      setAvailableOrders(availRes.data?.results || availRes.data || []);

      const allMy = allMyRes.data?.results || allMyRes.data || [];
      setMyOrders(allMy.filter(o => o.status === 'out_for_delivery'));
      setCompletedOrders(allMy.filter(o => o.status === 'delivered'));
      setAssignedPending(allMy.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)));
    } catch (err) {
      console.error('Failed to fetch delivery data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/users/me/', { headers });
      setProfile(res.data);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchData();
    fetchProfile();
    const interval = setInterval(fetchData, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [fetchData, fetchProfile]);

  const handleAccept = async (orderId) => {
    setActionLoading(orderId);
    try {
      await axios.post(`/api/delivery/orders/${orderId}/accept/`, {}, { headers });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to accept order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (orderId, otpCode) => {
    if (otpCode.length !== 6) {
      throw new Error('Enter the 6-digit OTP from the student');
    }
    setActionLoading(orderId);
    try {
      await axios.post(`/api/delivery/orders/${orderId}/complete/`, { pickup_otp: otpCode }, { headers });
      setDeliveryOtps(prev => ({ ...prev, [orderId]: '' }));
      await fetchData();
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setActionLoading(null);
    }
  };

  const getItemNames = (order) => {
    if (order.items?.length) return order.items.map(i => `${i.menu_item_name || i.item_name || i.name} ×${i.quantity}`).join(', ');
    return 'Order items';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statusLabel = (s) => {
    const map = { confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready for Pickup', out_for_delivery: 'Out for Delivery' };
    return map[s] || s?.replace(/_/g, ' ');
  };

  const statusColor = (s) => {
    const map = { confirmed: '#66cc66', preparing: '#ffaa33', ready: '#00ff66', out_for_delivery: '#b566ff' };
    return map[s] || '#999';
  };




  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', paddingBottom: 80 }}>
      <div style={{ maxWidth: 428, margin: '0 auto', background: '#000', minHeight: '100vh', position: 'relative' }}>

        {/* Header */}
        <div style={{ padding: '40px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#d45555' }}>
            {tab === 'home' ? 'Deliveries' : 'Profile'}
          </h1>
          <div onClick={() => {
              if (window.confirm('Log out?')) {
                localStorage.clear();
                navigate('/auth');
              }
            }}
            style={{ width: 40, height: 40, background: '#1a1a1a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #333' }}>
            <span style={{ fontSize: 20 }}>🚴</span>
          </div>
        </div>

        {tab === 'home' && (
          <div style={{ padding: '0 20px' }}>
            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#d45555' }}>{completedOrders.length}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>DELIVERED</div>
              </div>
              <div style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#ffaa33' }}>{availableOrders.length}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>AVAILABLE</div>
              </div>
              <div style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#00ff66' }}>
                  ₹{completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toFixed(0)}
                </div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>EARNINGS</div>
              </div>
            </div>

            {loading && (
              <div className="canteen-loading" style={{ marginBottom: 24 }}>
                <div className="canteen-loading-spinner" /><span style={{ color: '#999' }}>Loading...</span>
              </div>
            )}

            {/* Active Deliveries (out_for_delivery) */}
            {myOrders.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🚴 Active Deliveries <span style={{ color: '#b566ff' }}>({myOrders.length})</span>
                </h3>
                {myOrders.map(activeDelivery => {
                  const otp = deliveryOtps[activeDelivery.id] || '';
                  const err = otpErrors[activeDelivery.id] || '';
                  return (
                    <div key={activeDelivery.id} style={{ background: '#1a1a1a', border: '2px solid #b566ff', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 0 20px rgba(181,102,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>#{activeDelivery.order_number || activeDelivery.id}</span>
                        <span style={{ background: '#220033', color: '#b566ff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          Out for Delivery
                        </span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#eee', marginBottom: 10 }}>{getItemNames(activeDelivery)}</p>

                      <div style={{ background: '#111', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid #222' }}>
                        <div style={{ marginBottom: 8 }}>
                          <p style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>📍 Pickup from:</p>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{activeDelivery.canteen?.name || 'Canteen'}</p>
                        </div>
                        <div style={{ height: 1, background: '#222' }} />
                        <div style={{ marginTop: 8 }}>
                          <p style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>🏠 Deliver to:</p>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{activeDelivery.delivery_address || 'Student Address'}</p>
                        </div>
                      </div>

                      {/* OTP Entry */}
                      <div style={{ background: '#111', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid #333' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>🔑 Enter Student's OTP</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <input key={i} maxLength={1} value={otp[i] || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/, '');
                                const arr = otp.split('');
                                while(arr.length < 6) arr.push('');
                                arr[i] = val;
                                setDeliveryOtps(prev => ({...prev, [activeDelivery.id]: arr.join('').substring(0, 6)}));
                                setOtpErrors(prev => ({...prev, [activeDelivery.id]: ''}));
                                if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !otp[i] && e.target.previousElementSibling) e.target.previousElementSibling.focus();
                              }}
                              style={{
                                width: 36, height: 44, textAlign: 'center', fontSize: 18, fontWeight: 700,
                                background: '#000', color: '#d45555', border: err ? '2px solid #ff3333' : '2px solid #d45555',
                                borderRadius: 8, outline: 'none', fontFamily: 'monospace',
                              }}
                            />
                          ))}
                        </div>
                        {err && <p style={{ color: '#ff3333', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>{err}</p>}
                      </div>

                      <button onClick={async () => {
                          const currentOtp = deliveryOtps[activeDelivery.id] || '';
                          try {
                            await handleComplete(activeDelivery.id, currentOtp);
                          } catch (e) {
                            setOtpErrors(prev => ({...prev, [activeDelivery.id]: e.message || 'Verification failed'}));
                          }
                        }}
                        disabled={actionLoading === activeDelivery.id || otp.length < 6}
                        style={{
                          width: '100%', padding: 14,
                          background: (actionLoading === activeDelivery.id || otp.length < 6) ? '#333' : '#d45555',
                          color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
                          cursor: (actionLoading === activeDelivery.id || otp.length < 6) ? 'not-allowed' : 'pointer',
                        }}>
                        {actionLoading === activeDelivery.id ? 'Verifying...' : '✅ Confirm Delivery'}
                      </button>

                      <p style={{ fontSize: 11, color: '#666', marginTop: 8, textAlign: 'center' }}>
                        ₹{activeDelivery.total_amount} • Accepted {formatTime(activeDelivery.delivery_accepted_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Assigned but not yet out for delivery (food still being prepared) */}
            {assignedPending.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>⏳ Assigned – Waiting for Food</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {assignedPending.map(order => (
                    <div key={order.id} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 14, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>#{order.order_number || order.id}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#332200', color: '#ffaa33' }}>
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#ddd', marginBottom: 6 }}>{getItemNames(order)}</p>
                      <p style={{ fontSize: 12, color: '#888' }}>📍 {order.canteen?.name || 'Canteen'} → {order.delivery_address || 'Student'}</p>
                      <p style={{ fontSize: 12, color: '#d45555', fontWeight: 600, marginTop: 4 }}>₹{order.total_amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available / Pending Deliveries */}
            {!loading && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                  📦 Pending Deliveries {availableOrders.length > 0 && <span style={{ color: '#d45555' }}>({availableOrders.length})</span>}
                </h3>

                {availableOrders.length === 0 ? (
                  <div style={{ background: '#1a1a1a', border: '1px dashed #333', borderRadius: 12, padding: 28, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <p style={{ color: '#666', fontSize: 13 }}>No delivery orders available right now</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {availableOrders.map(order => (
                      <div key={order.id} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 14, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>#{order.order_number || order.id}</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                            background: order.status === 'ready' ? '#003311' : order.status === 'preparing' ? '#332200' : '#112211',
                            color: statusColor(order.status),
                            border: `1px solid ${statusColor(order.status)}`,
                          }}>
                            {statusLabel(order.status)}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, color: '#eee', fontWeight: 500, marginBottom: 8 }}>{getItemNames(order)}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: '#999' }}>📍 {order.canteen?.name || 'Canteen'}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#d45555' }}>₹{order.total_amount}</span>
                        </div>
                        {order.delivery_address && (
                          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>🏠 → {order.delivery_address}</p>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleAccept(order.id)}
                            disabled={actionLoading === order.id}
                            style={{
                              flex: 1, padding: 12,
                              background: actionLoading === order.id ? '#333' : '#d45555',
                              color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13,
                              cursor: actionLoading === order.id ? 'not-allowed' : 'pointer',
                            }}>
                            {actionLoading === order.id ? 'Accepting...' : '🚴 Volunteer to Deliver'}
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: '#666', marginTop: 6, textAlign: 'center' }}>{formatTime(order.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Completed Today */}
            {completedOrders.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>✅ Completed ({completedOrders.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {completedOrders.slice(0, 5).map(order => (
                    <div key={order.id} style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>#{order.order_number || order.id}</span>
                        <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{getItemNames(order)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#d45555' }}>₹{order.total_amount}</span>
                        <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{formatTime(order.delivered_at || order.updated_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div style={{ padding: '0 20px' }}>
            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, background: '#220044', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>🚴</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{profile?.full_name || profile?.email || 'Delivery Coordinator'}</h2>
              <p style={{ fontSize: 13, color: '#888' }}>{profile?.email}</p>
              {profile?.phone_number && <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{profile.phone_number}</p>}
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: '#220044', color: '#b566ff', border: '1px solid #b566ff', marginTop: 12 }}>
                Delivery Coordinator
              </span>
            </div>

            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Performance</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#d45555' }}>{completedOrders.length}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Deliveries</div>
                </div>
                <div style={{ width: 1, background: '#333' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#00ff66' }}>
                    ₹{completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Order Value</div>
                </div>
              </div>
            </div>

            <button onClick={() => { if (window.confirm('Log out?')) { localStorage.clear(); navigate('/auth'); } }}
              style={{
                width: '100%', padding: 14, background: '#331111', color: '#ff6b6b',
                border: '1px solid #ff6b6b', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
              Logout
            </button>
          </div>
        )}

        {/* Bottom Navigation - 2 tabs */}
        <nav style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          maxWidth: 428, width: '100%', background: '#000', borderTop: '1px solid #333',
          display: 'flex', justifyContent: 'space-around', padding: '12px 0', zIndex: 100,
        }}>
          <button onClick={() => setTab('home')} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: tab === 'home' ? '#d45555' : '#666', background: 'none', border: 'none',
            fontSize: 11, padding: '8px 20px', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 20 }}>🏠</span>Home
          </button>
          <button onClick={() => setTab('profile')} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: tab === 'profile' ? '#d45555' : '#666', background: 'none', border: 'none',
            fontSize: 11, padding: '8px 20px', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 20 }}>👤</span>Profile
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
