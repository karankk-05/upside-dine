import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart,
  ClipboardList,
  CreditCard,
  LogOut,
  Plus,
  Settings,
  Store,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import PullToRefresh from '../components/PullToRefresh';
import api from '../lib/api';
import { logoutUser } from '../lib/auth';
import {
  STANDARD_INPUT_PROPS,
  sanitizeEmail,
  sanitizePersonName,
  sanitizePhone,
  sanitizeUpiId,
  sanitizeUrl,
} from '../lib/formValidation';
import '../features/canteen/canteen.css';

const DELIVERY_PERSONNEL_QUERY_KEY = ['canteen-manager', 'delivery-personnel'];
const PAYMENT_CONFIG_QUERY_KEY = ['canteen-manager', 'payment-config'];

const DeliveryPersonnelSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={`delivery-person-skeleton-${index}`}
        style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            className="ui-skeleton ui-skeleton-text"
            style={{ width: '42%', height: 16, marginBottom: 10 }}
          />
          <div className="ui-skeleton ui-skeleton-text" style={{ width: '78%', height: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="ui-skeleton ui-skeleton-card" style={{ width: 36, height: 36 }} />
          <div className="ui-skeleton ui-skeleton-card" style={{ width: 36, height: 36 }} />
        </div>
      </div>
    ))}
  </div>
);

const PaymentSettingsSkeleton = () => (
  <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
    {Array.from({ length: 2 }).map((_, index) => (
      <div
        key={`payment-skeleton-${index}`}
        style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          className="ui-skeleton ui-skeleton-text"
          style={{ width: '38%', height: 16, marginBottom: 16 }}
        />
        <div
          className="ui-skeleton ui-skeleton-card"
          style={{ width: '100%', height: 48, marginBottom: 12, borderRadius: 12 }}
        />
        <div
          className="ui-skeleton ui-skeleton-card"
          style={{ width: '100%', height: 48, borderRadius: 12 }}
        />
      </div>
    ))}
    <div className="ui-skeleton ui-skeleton-card" style={{ width: '100%', height: 52 }} />
  </div>
);

const normalizePaymentConfig = (data) => ({
  upi_id: data?.upi_id || '',
  payment_mode: data?.payment_mode || 'both',
  qr_image_url: data?.qr_image_url || '',
});

const CanteenManagerDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('canteen');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '' });
  const [addResult, setAddResult] = useState(null);
  const [addError, setAddError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    upi_id: '',
    payment_mode: 'both',
    qr_image_url: '',
  });
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentDirty, setPaymentDirty] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);

  const isDeliveryTab = activeTab === 'delivery';
  const isPaymentTab = activeTab === 'payment';

  const { data: deliveryPersonnel = [], isLoading: isLoadingDelivery } = useQuery({
    queryKey: DELIVERY_PERSONNEL_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/manager/delivery-personnel/');
      return Array.isArray(data) ? data : [];
    },
    enabled: isDeliveryTab,
  });

  const {
    data: paymentConfig,
    isLoading: isLoadingPayment,
  } = useQuery({
    queryKey: PAYMENT_CONFIG_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/canteen-manager/payment-config/');
      return normalizePaymentConfig(data);
    },
    enabled: isPaymentTab,
  });

  useEffect(() => {
    if (!paymentConfig || paymentDirty) {
      return;
    }

    setPaymentSettings(paymentConfig);
    setQrPreview(paymentConfig.qr_image_url || null);
  }, [paymentConfig, paymentDirty]);

  const refreshDeliveryPersonnel = useCallback(
    async () => queryClient.invalidateQueries({ queryKey: DELIVERY_PERSONNEL_QUERY_KEY }),
    [queryClient]
  );

  const refreshPaymentConfig = useCallback(
    async () => queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIG_QUERY_KEY }),
    [queryClient]
  );

  const updateAddForm = (field, value) => {
    const nextValueByField = {
      full_name: sanitizePersonName(value),
      email: sanitizeEmail(value),
      phone: sanitizePhone(value),
    };

    setAddForm((current) => ({
      ...current,
      [field]: nextValueByField[field] ?? value,
    }));
    setAddError('');
  };

  const updatePaymentSettings = (field, value) => {
    const nextValueByField = {
      upi_id: sanitizeUpiId(value),
      qr_image_url: sanitizeUrl(value),
    };
    const nextValue = nextValueByField[field] ?? value;

    setPaymentSettings((current) => ({
      ...current,
      [field]: nextValue,
    }));
    if (field === 'qr_image_url') {
      setQrPreview(nextValue || null);
    }
    setPaymentSaved(false);
    setPaymentDirty(true);
    setPaymentError('');
  };

  const savePaymentConfig = async () => {
    setPaymentError('');
    setPaymentSaving(true);

    const payload = {
      upi_id: paymentSettings.upi_id.trim(),
      payment_mode: paymentSettings.payment_mode,
      qr_image_url: paymentSettings.qr_image_url.trim(),
    };

    try {
      await api.put('/canteen-manager/payment-config/', payload);
      queryClient.setQueryData(PAYMENT_CONFIG_QUERY_KEY, payload);
      setPaymentSettings(payload);
      setQrPreview(payload.qr_image_url || null);
      setPaymentDirty(false);
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
    } catch (error) {
      setPaymentError(error.response?.data?.detail || 'Failed to save payment settings.');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleAddDeliveryPerson = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setAddError('');
    setAddResult(null);

    try {
      const { data } = await api.post('/manager/delivery-personnel/', addForm);
      setAddResult(data);
      setAddForm({ full_name: '', email: '', phone: '' });
      await refreshDeliveryPersonnel();
    } catch (error) {
      setAddError(
        error.response?.data?.detail ||
          error.response?.data?.email?.[0] ||
          'Unable to create delivery person.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (userId) => {
    try {
      await api.patch(`/manager/delivery-personnel/${userId}/toggle/`);
      await refreshDeliveryPersonnel();
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to toggle status.');
    }
  };

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Delete delivery person ${email}?`)) {
      return;
    }

    try {
      await api.delete(`/manager/delivery-personnel/${userId}/toggle/`);
      await refreshDeliveryPersonnel();
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to delete delivery person.');
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Log out?')) {
      return;
    }

    await logoutUser();
    navigate('/auth');
  };

  const canteenCards = [
    {
      icon: <Store size={22} />,
      title: 'Manage Menu',
      desc: 'Add, update, or remove canteen items.',
      route: '/manager/canteen/menu',
    },
    {
      icon: <ClipboardList size={22} />,
      title: 'Active Orders',
      desc: 'View and manage incoming student orders.',
      route: '/manager/canteen/orders',
    },
    {
      icon: <BarChart size={22} />,
      title: 'Statistics',
      desc: 'View gross revenue and popular items.',
      route: '/manager/canteen/stats',
    },
  ];

  const navItems = [
    { id: 'canteen', icon: <Settings size={20} />, label: 'Manage Canteen' },
    { id: 'delivery', icon: <Users size={20} />, label: 'Delivery Staff' },
    { id: 'payment', icon: <CreditCard size={20} />, label: 'Payment Settings' },
    { id: 'profile', icon: <User size={20} />, label: 'Profile', route: '/profile' },
  ];

  const handleNavClick = (item) => {
    if (item.route) {
      navigate(item.route);
      return;
    }

    setActiveTab(item.id);
    setAddResult(null);
    setAddError('');
  };

  const handleRefresh = useCallback(async () => {
    if (isDeliveryTab) {
      await refreshDeliveryPersonnel();
      return;
    }

    if (isPaymentTab) {
      await refreshPaymentConfig();
    }
  }, [isDeliveryTab, isPaymentTab, refreshDeliveryPersonnel, refreshPaymentConfig]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#fff',
          display: 'flex',
        }}
      >
        <aside
          style={{
            width: 240,
            background: '#111',
            borderRight: '1px solid #333',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 50,
          }}
          className="mgr-sidebar"
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#d45555',
              padding: '0 20px',
              marginBottom: 32,
            }}
          >
            Canteen Manager
          </h2>
          <nav style={{ flex: 1 }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: activeTab === item.id ? '#1a1a1a' : 'transparent',
                  border: 'none',
                  borderLeft:
                    activeTab === item.id ? '3px solid #d45555' : '3px solid transparent',
                  color: activeTab === item.id ? '#fff' : '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: activeTab === item.id ? 600 : 400,
                  transition: 'all 0.2s',
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            style={{
              margin: '0 20px',
              padding: '12px 0',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 10,
              color: '#d45555',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
            }}
          >
            <LogOut size={16} /> Log Out
          </button>
        </aside>

        <main
          style={{ flex: 1, padding: '32px 24px 100px', marginLeft: 240 }}
          className="mgr-main"
        >
          {activeTab === 'canteen' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Manage Canteen</h1>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                {canteenCards.map((card) => (
                  <div
                    key={card.route}
                    className="canteen-feature-card"
                    onClick={() => navigate(card.route)}
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 16,
                      padding: 20,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: '#2a2a2a',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#d45555',
                        }}
                      >
                        {card.icon}
                      </div>
                      <h2 style={{ fontSize: 16, fontWeight: 600 }}>{card.title}</h2>
                    </div>
                    <p style={{ fontSize: 13, color: '#999', lineHeight: 1.4 }}>{card.desc}</p>
                  </div>
                ))}
              </div>

              <style>{`
                .canteen-feature-card:hover {
                  border-color: #d45555 !important;
                  box-shadow: 0 0 15px rgba(232,85,85,0.12);
                }
              `}</style>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Delivery Personnel</h1>
                <button
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setAddResult(null);
                    setAddError('');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: showAddForm ? '#333' : '#d45555',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {showAddForm ? (
                    <>
                      <X size={16} /> Cancel
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Add Personnel
                    </>
                  )}
                </button>
              </div>

              {showAddForm && (
                <div
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 24,
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    New Delivery Person
                  </h3>
                  <form
                    onSubmit={handleAddDeliveryPerson}
                    noValidate
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                  >
                    <input
                      placeholder="Full Name"
                      value={addForm.full_name}
                      required
                      onChange={(event) => updateAddForm('full_name', event.target.value)}
                      {...STANDARD_INPUT_PROPS.personName}
                      style={{
                        padding: 12,
                        background: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 14,
                      }}
                    />
                    <input
                      placeholder="Email"
                      value={addForm.email}
                      required
                      onChange={(event) => updateAddForm('email', event.target.value)}
                      {...STANDARD_INPUT_PROPS.email}
                      style={{
                        padding: 12,
                        background: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 14,
                      }}
                    />
                    <input
                      placeholder="Phone"
                      value={addForm.phone}
                      required
                      onChange={(event) => updateAddForm('phone', event.target.value)}
                      {...STANDARD_INPUT_PROPS.phone}
                      style={{
                        padding: 12,
                        background: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 14,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: 14,
                        background: '#d45555',
                        border: 'none',
                        borderRadius: 10,
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        opacity: submitting ? 0.6 : 1,
                      }}
                    >
                      {submitting ? 'Creating...' : 'Create Delivery Person'}
                    </button>
                  </form>

                  {addError ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#331111',
                        border: '1px solid #d45555',
                        borderRadius: 10,
                        color: '#ff6b6b',
                        fontSize: 13,
                      }}
                    >
                      {addError}
                    </div>
                  ) : null}

                  {addResult ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 16,
                        background: '#112211',
                        border: '1px solid #33aa33',
                        borderRadius: 10,
                        fontSize: 13,
                      }}
                    >
                      <p style={{ fontWeight: 700, color: '#33aa33', marginBottom: 8 }}>
                        Delivery person created
                      </p>
                      <p>
                        <strong>Email:</strong> {addResult.email}
                      </p>
                      <p>
                        <strong>Employee Code:</strong>{' '}
                        <code
                          style={{
                            background: '#2a2a2a',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {addResult.employee_code}
                        </code>
                      </p>
                      <p style={{ color: '#999', marginTop: 8, fontSize: 12 }}>
                        Login credentials have been sent to the registered email.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {isLoadingDelivery && deliveryPersonnel.length === 0 ? (
                <DeliveryPersonnelSkeleton />
              ) : deliveryPersonnel.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🚴</div>
                  <p>No delivery personnel assigned.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {deliveryPersonnel.map((person) => (
                    <div
                      key={person.id}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: 16,
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 4,
                            flexWrap: 'wrap',
                          }}
                        >
                          <h3 style={{ fontSize: 15, fontWeight: 600 }}>{person.full_name}</h3>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: person.is_active ? '#112211' : '#331111',
                              color: person.is_active ? '#33aa33' : '#ff6b6b',
                              border: `1px solid ${
                                person.is_active ? '#33aa33' : '#ff6b6b'
                              }`,
                              textTransform: 'uppercase',
                            }}
                          >
                            {person.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#999' }}>
                          {person.email} · {person.phone} · Code: {person.employee_code}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleToggle(person.id)}
                          title={person.is_active ? 'Deactivate' : 'Activate'}
                          style={{
                            width: 36,
                            height: 36,
                            background: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: 8,
                            color: person.is_active ? '#33aa33' : '#ff6b6b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {person.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => handleDelete(person.id, person.email)}
                          title="Delete"
                          style={{
                            width: 36,
                            height: 36,
                            background: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: 8,
                            color: '#ff6b6b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Payment Settings</h1>
              {isLoadingPayment && !paymentConfig ? (
                <PaymentSettingsSkeleton />
              ) : (
                <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {paymentError ? (
                    <div
                      style={{
                        padding: 12,
                        background: '#331111',
                        border: '1px solid #d45555',
                        borderRadius: 10,
                        color: '#ff6b6b',
                        fontSize: 13,
                      }}
                    >
                      {paymentError}
                    </div>
                  ) : null}

                  <div
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 16,
                      padding: 20,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CreditCard size={18} style={{ color: '#d45555' }} /> UPI Details
                    </h3>
                    <label
                      style={{
                        fontSize: 12,
                        color: '#999',
                        marginBottom: 6,
                        display: 'block',
                      }}
                    >
                      UPI ID
                    </label>
                    <input
                      placeholder="yourcanteen@upi"
                      value={paymentSettings.upi_id}
                      onChange={(event) => updatePaymentSettings('upi_id', event.target.value)}
                      {...STANDARD_INPUT_PROPS.upiId}
                      style={{
                        width: '100%',
                        padding: 12,
                        background: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 14,
                        marginBottom: 12,
                        outline: 'none',
                      }}
                    />

                    <label
                      style={{
                        fontSize: 12,
                        color: '#999',
                        marginBottom: 6,
                        display: 'block',
                      }}
                    >
                      Payment QR Code (URL or link)
                    </label>
                    <input
                      placeholder="https://example.com/your-qr-code.png (optional)"
                      value={paymentSettings.qr_image_url}
                      onChange={(event) =>
                        updatePaymentSettings('qr_image_url', event.target.value)
                      }
                      {...STANDARD_INPUT_PROPS.url}
                      style={{
                        width: '100%',
                        padding: 12,
                        background: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 14,
                        marginBottom: 12,
                        outline: 'none',
                      }}
                    />
                    {qrPreview ? (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img
                          src={qrPreview}
                          alt="QR Preview"
                          style={{
                            maxWidth: 180,
                            maxHeight: 180,
                            borderRadius: 8,
                            border: '1px solid #333',
                          }}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: 8,
                          minHeight: 88,
                          borderRadius: 12,
                          border: '1px dashed #333',
                          color: '#777',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          fontSize: 13,
                        }}
                      >
                        <Upload size={16} />
                        Add a QR link to preview it here
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 16,
                      padding: 20,
                    }}
                  >
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                      Accepted Payment Mode
                    </h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['online', 'cash', 'both'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            setPaymentSettings((current) => ({
                              ...current,
                              payment_mode: mode,
                            }));
                            setPaymentSaved(false);
                            setPaymentDirty(true);
                          }}
                          style={{
                            flex: 1,
                            padding: '12px 8px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            background:
                              paymentSettings.payment_mode === mode ? '#2a1111' : '#222',
                            border:
                              paymentSettings.payment_mode === mode
                                ? '1px solid #d45555'
                                : '1px solid #444',
                            color:
                              paymentSettings.payment_mode === mode ? '#d45555' : '#999',
                            transition: 'all 0.2s',
                          }}
                        >
                          {mode === 'online'
                            ? 'Online'
                            : mode === 'cash'
                              ? 'Cash'
                              : 'Both'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={savePaymentConfig}
                    disabled={paymentSaving}
                    style={{
                      padding: 14,
                      background: '#d45555',
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                      boxShadow: '0 0 15px rgba(232,85,85,0.15)',
                      transition: 'all 0.2s',
                      opacity: paymentSaving ? 0.7 : 1,
                    }}
                  >
                    {paymentSaving
                      ? 'Saving...'
                      : paymentSaved
                        ? 'Saved'
                        : 'Save Payment Settings'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <nav
          className="mgr-bottombar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#111',
            borderTop: '1px solid #333',
            display: 'none',
            justifyContent: 'space-around',
            padding: '10px 0',
            zIndex: 100,
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === item.id ? '#d45555' : '#999',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <style>{`
          @media (max-width: 767px) {
            .mgr-sidebar { display: none !important; }
            .mgr-main { margin-left: 0 !important; padding-bottom: 80px !important; }
            .mgr-bottombar { display: flex !important; }
          }
        `}</style>
      </div>
    </PullToRefresh>
  );
};

export default CanteenManagerDashboard;
