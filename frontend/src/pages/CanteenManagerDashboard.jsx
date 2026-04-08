import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Store, ClipboardList, Package, Users, Settings, Plus, Trash2, ToggleLeft, ToggleRight, LogOut, X, User, BarChart, CreditCard, Upload } from 'lucide-react';
import '../features/canteen/canteen.css';

const UPI_ID_PATTERN = /^[A-Za-z0-9._-]{2,64}@[A-Za-z0-9.-]{2,64}$/;

const getUpiIdValidationError = (value) => {
  if (!value) return '';
  return UPI_ID_PATTERN.test(value) ? '' : 'Enter a valid UPI ID like yourname@bank.';
};

const extractPaymentConfigError = (data) => {
  if (!data) return 'Failed to save payment settings.';
  if (typeof data.detail === 'string') return data.detail;

  const fieldError = [data.upi_id, data.qr_image_url, data.payment_mode]
    .find((value) => Array.isArray(value) && typeof value[0] === 'string');

  return fieldError?.[0] || 'Failed to save payment settings.';
};

const CanteenManagerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('canteen');

  // Delivery personnel management state
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '' });
  const [addResult, setAddResult] = useState(null);
  const [addError, setAddError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    upi_id: '',
    payment_mode: 'both',
    qr_image_url: '',
  });
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [qrPreview, setQrPreview] = useState(null);

  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };
  const normalizedUpiId = paymentSettings.upi_id.trim();
  const upiIdValidationError = getUpiIdValidationError(normalizedUpiId);

  const fetchDeliveryPersonnel = async () => {
    setLoadingDelivery(true);
    try {
      const res = await axios.get('/api/manager/delivery-personnel/', { headers });
      setDeliveryPersonnel(res.data || []);
    } catch (err) {
      console.error('Delivery personnel currently not available:', err);
    } finally {
      setLoadingDelivery(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'delivery') fetchDeliveryPersonnel();
    if (activeTab === 'payment') fetchPaymentConfig();
  }, [activeTab]);

  const fetchPaymentConfig = async () => {
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const res = await axios.get('/api/canteen-manager/payment-config/', { headers });
      setPaymentSettings({
        upi_id: res.data.upi_id || '',
        payment_mode: res.data.payment_mode || 'both',
        qr_image_url: res.data.qr_image_url || '',
      });
      if (res.data.qr_image_url) setQrPreview(res.data.qr_image_url);
    } catch (err) {
      setPaymentError('Failed to load payment settings.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const savePaymentConfig = async () => {
    setPaymentError('');
    if (upiIdValidationError) {
      setPaymentError(upiIdValidationError);
      return;
    }

    const nextPaymentSettings = {
      ...paymentSettings,
      upi_id: normalizedUpiId,
    };

    setPaymentSettings(nextPaymentSettings);
    try {
      await axios.put('/api/canteen-manager/payment-config/', {
        upi_id: nextPaymentSettings.upi_id,
        payment_mode: nextPaymentSettings.payment_mode,
        qr_image_url: nextPaymentSettings.qr_image_url,
      }, { headers });
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
    } catch (err) {
      setPaymentError(extractPaymentConfigError(err.response?.data));
    }
  };

  const handleAddDeliveryPerson = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAddError('');
    setAddResult(null);
    try {
      const res = await axios.post('/api/manager/delivery-personnel/', addForm, { headers });
      setAddResult(res.data);
      setAddForm({ full_name: '', email: '', phone: '' });
      fetchDeliveryPersonnel();
    } catch (err) {
      setAddError(err.response?.data?.detail || err.response?.data?.email?.[0] || 'Unable to create delivery person.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (userId) => {
    try {
      await axios.patch(`/api/manager/delivery-personnel/${userId}/toggle/`, {}, { headers });
      fetchDeliveryPersonnel();
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to toggle status.');
    }
  };

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Delete delivery person ${email}?`)) return;
    try {
      // NOTE: backend may not have DELETE toggle, so this mimics the mess worker pattern
      await axios.delete(`/api/manager/delivery-personnel/${userId}/toggle/`, { headers });
      fetchDeliveryPersonnel();
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to delete delivery person.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Log out?')) {
      localStorage.clear();
      navigate('/auth');
    }
  };

  const canteenCards = [
    { icon: <Store size={22} />, title: 'Manage Menu', desc: 'Add, update, or remove canteen items.', route: '/manager/canteen/menu' },
    { icon: <ClipboardList size={22} />, title: "Active Orders", desc: "View and manage incoming student orders.", route: '/manager/canteen/orders' },
    { icon: <BarChart size={22} />, title: "Statistics", desc: "View gross revenue and popular items.", route: '/manager/canteen/stats' },
  ];

  const navItems = [
    { id: 'canteen', icon: <Settings size={20} />, label: 'Manage Canteen' },
    { id: 'delivery', icon: <Users size={20} />, label: 'Delivery Staff' },
    { id: 'payment', icon: <CreditCard size={20} />, label: 'Payment Settings' },
    { id: 'profile', icon: <User size={20} />, label: 'Profile' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex' }}>

      {/* Desktop Sidebar (≥768px) */}
      <aside style={{
        width: 240, background: '#111', borderRight: '1px solid #333', padding: '24px 0',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50,
      }} className="mgr-sidebar">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#d45555', padding: '0 20px', marginBottom: 32 }}>Canteen Manager</h2>
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%', padding: '14px 20px', background: activeTab === item.id ? '#1a1a1a' : 'transparent',
                border: 'none', borderLeft: activeTab === item.id ? '3px solid #d45555' : '3px solid transparent',
                color: activeTab === item.id ? '#fff' : '#999', display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', fontSize: 14, fontWeight: activeTab === item.id ? 600 : 400, transition: 'all 0.2s',
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} style={{
          margin: '0 20px', padding: '12px 0', background: 'transparent', border: '1px solid #333',
          borderRadius: 10, color: '#d45555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14,
        }}>
          <LogOut size={16} /> Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px 24px 100px', marginLeft: 240 }} className="mgr-main">

        {/* ── Manage Canteen Tab ── */}
        {activeTab === 'canteen' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Manage Canteen</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {canteenCards.map((card) => (
                <div key={card.route} className="canteen-feature-card" onClick={() => navigate(card.route)}
                  style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, background: '#2a2a2a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d45555' }}>
                      {card.icon}
                    </div>
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>{card.title}</h2>
                  </div>
                  <p style={{ fontSize: 13, color: '#999', lineHeight: 1.4 }}>{card.desc}</p>
                </div>
              ))}
            </div>
            
            {/* Embedded styles for hover effects */}
            <style>{`
              .canteen-feature-card:hover {
                border-color: #d45555 !important;
                box-shadow: 0 0 15px rgba(232,85,85,0.12);
              }
            `}</style>
          </div>
        )}

        {/* ── Delivery Personnel Tab ── */}
        {activeTab === 'delivery' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Delivery Personnel</h1>
              <button onClick={() => { setShowAddForm(!showAddForm); setAddResult(null); setAddError(''); }}
                style={{
                  padding: '10px 20px', background: showAddForm ? '#333' : '#d45555', border: 'none', borderRadius: 10,
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600,
                }}>
                {showAddForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Personnel</>}
              </button>
            </div>

            {/* Add Delivery Form */}
            {showAddForm && (
              <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Delivery Person</h3>
                <form onSubmit={handleAddDeliveryPerson} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input placeholder="Full Name" value={addForm.full_name} required
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    style={{ padding: 12, background: '#2a2a2a', border: '1px solid #444', borderRadius: 10, color: '#fff', fontSize: 14 }} />
                  <input placeholder="Email" type="email" value={addForm.email} required
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    style={{ padding: 12, background: '#2a2a2a', border: '1px solid #444', borderRadius: 10, color: '#fff', fontSize: 14 }} />
                  <input placeholder="Phone" value={addForm.phone} required
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    style={{ padding: 12, background: '#2a2a2a', border: '1px solid #444', borderRadius: 10, color: '#fff', fontSize: 14 }} />
                  <button type="submit" disabled={submitting}
                    style={{ padding: 14, background: '#d45555', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Creating...' : 'Create Delivery Person'}
                  </button>
                </form>

                {addError && <div style={{ marginTop: 12, padding: 12, background: '#331111', border: '1px solid #d45555', borderRadius: 10, color: '#ff6b6b', fontSize: 13 }}>{addError}</div>}

                {addResult && (
                  <div style={{ marginTop: 12, padding: 16, background: '#112211', border: '1px solid #33aa33', borderRadius: 10, fontSize: 13 }}>
                    <p style={{ fontWeight: 700, color: '#33aa33', marginBottom: 8 }}>✅ Delivery Person created!</p>
                    <p><strong>Email:</strong> {addResult.email}</p>
                    <p><strong>Employee Code:</strong> <code style={{ background: '#2a2a2a', padding: '2px 6px', borderRadius: 4 }}>{addResult.employee_code}</code></p>
                    <p style={{ color: '#999', marginTop: 8, fontSize: 12 }}>Login credentials have been sent to the registered email.</p>
                  </div>
                )}
              </div>
            )}

            {/* Personnel List */}
            {loadingDelivery ? (
              <div className="canteen-loading"><div className="canteen-loading-spinner" /><span style={{ color: '#999' }}>Loading...</span></div>
            ) : deliveryPersonnel.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚴</div>
                <p>No delivery personnel assigned.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {deliveryPersonnel.map((person) => (
                  <div key={person.id} style={{
                    background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600 }}>{person.full_name}</h3>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: person.is_active ? '#112211' : '#331111', color: person.is_active ? '#33aa33' : '#ff6b6b',
                          border: `1px solid ${person.is_active ? '#33aa33' : '#ff6b6b'}`, textTransform: 'uppercase',
                        }}>
                          {person.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#999' }}>{person.email} · {person.phone} · Code: {person.employee_code}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleToggle(person.id)} title={person.is_active ? 'Deactivate' : 'Activate'}
                        style={{ width: 36, height: 36, background: '#2a2a2a', border: '1px solid #444', borderRadius: 8, color: person.is_active ? '#33aa33' : '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {person.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => handleDelete(person.id, person.email)} title="Delete"
                        style={{ width: 36, height: 36, background: '#2a2a2a', border: '1px solid #444', borderRadius: 8, color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Payment Settings Tab ── */}
        {activeTab === 'payment' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Payment Settings</h1>
            {paymentLoading ? (
              <div className="canteen-loading"><div className="canteen-loading-spinner" /><span style={{ color: '#999' }}>Loading...</span></div>
            ) : (
            <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {paymentError && <div style={{ padding: 12, background: '#331111', border: '1px solid #d45555', borderRadius: 10, color: '#ff6b6b', fontSize: 13 }}>{paymentError}</div>}

              {/* UPI ID */}
              <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} style={{ color: '#d45555' }} /> UPI Details
                </h3>
                <label style={{ fontSize: 12, color: '#999', marginBottom: 6, display: 'block' }}>UPI ID</label>
                <input
                  type="text"
                  placeholder="yourcanteen@upi"
                  value={paymentSettings.upi_id}
                  onChange={(e) => {
                    setPaymentSettings({ ...paymentSettings, upi_id: e.target.value });
                    setPaymentSaved(false);
                    setPaymentError('');
                  }}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#2a2a2a',
                    border: upiIdValidationError ? '1px solid #d45555' : '1px solid #444',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    marginBottom: 12,
                    outline: 'none',
                  }}
                />
                {upiIdValidationError ? (
                  <p style={{ margin: '-4px 0 12px', color: '#ff6b6b', fontSize: 12 }}>{upiIdValidationError}</p>
                ) : (
                  <p style={{ margin: '-4px 0 12px', color: '#888', fontSize: 12 }}>
                    Use a valid UPI ID format like `yourcanteen@upi`.
                  </p>
                )}

                <label style={{ fontSize: 12, color: '#999', marginBottom: 6, display: 'block' }}>Payment QR Code (URL or link)</label>
                <input
                  type="text"
                  placeholder="https://example.com/your-qr-code.png (optional)"
                  value={paymentSettings.qr_image_url}
                  onChange={(e) => {
                    setPaymentSettings({ ...paymentSettings, qr_image_url: e.target.value });
                    setQrPreview(e.target.value);
                    setPaymentSaved(false);
                    setPaymentError('');
                  }}
                  style={{ width: '100%', padding: 12, background: '#2a2a2a', border: '1px solid #444', borderRadius: 10, color: '#fff', fontSize: 14, marginBottom: 12, outline: 'none' }}
                />
                {qrPreview && (
                  <div style={{ marginTop: 8, textAlign: 'center' }}>
                    <img src={qrPreview} alt="QR Preview" style={{ maxWidth: 180, maxHeight: 180, borderRadius: 8, border: '1px solid #333' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Payment Mode */}
              <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Accepted Payment Mode</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['online', 'cash', 'both'].map((mode) => (
                    <button key={mode}
                      onClick={() => { setPaymentSettings({ ...paymentSettings, payment_mode: mode }); setPaymentSaved(false); }}
                      style={{
                        flex: 1, padding: '12px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: paymentSettings.payment_mode === mode ? '#2a1111' : '#222',
                        border: paymentSettings.payment_mode === mode ? '1px solid #d45555' : '1px solid #444',
                        color: paymentSettings.payment_mode === mode ? '#d45555' : '#999',
                        transition: 'all 0.2s',
                      }}
                    >
                      {mode === 'online' ? '💳 Online' : mode === 'cash' ? '💵 Cash' : '✅ Both'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={savePaymentConfig}
                disabled={Boolean(upiIdValidationError)}
                style={{
                  padding: 14, background: '#d45555', border: 'none', borderRadius: 10, color: '#fff',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 0 15px rgba(232,85,85,0.15)',
                  transition: 'all 0.2s',
                  opacity: upiIdValidationError ? 0.6 : 1,
                }}
              >
                {paymentSaved ? '✅ Saved!' : 'Save Payment Settings'}
              </button>
            </div>
            )}
          </div>
        )}

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Manager Profile</h1>
            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 400 }}>
              <div style={{ width: 80, height: 80, background: '#2a2a2a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d45555' }}>
                <User size={40} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Canteen Manager Account</h2>
                <p style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>{localStorage.getItem('user_email') || window.location.hostname}</p>
                <div style={{ display: 'inline-block', padding: '4px 10px', background: '#331111', color: '#ff6b6b', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid #d45555' }}>
                  Role: Manager
                </div>
              </div>
              <button onClick={handleLogout} style={{
                marginTop: 24, padding: '12px 24px', background: 'transparent', border: '1px solid #d45555',
                borderRadius: 10, color: '#d45555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, width: '100%', transition: 'all 0.2s'
              }}>
                <LogOut size={18} /> Log Out from Manager Account
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Bar (<768px) */}
      <nav className="mgr-bottombar" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', borderTop: '1px solid #333',
        display: 'none', justifyContent: 'space-around', padding: '10px 0', zIndex: 100,
      }}>
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            style={{
              background: 'transparent', border: 'none', color: activeTab === item.id ? '#d45555' : '#999',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11,
            }}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 767px) {
          .mgr-sidebar { display: none !important; }
          .mgr-main { margin-left: 0 !important; padding-bottom: 80px !important; }
          .mgr-bottombar { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default CanteenManagerDashboard;
