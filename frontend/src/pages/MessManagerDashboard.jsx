import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  LogOut,
  Plus,
  Settings,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  Users,
  UtensilsCrossed,
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
} from '../lib/formValidation';
import '../features/mess/mess.css';

const MESS_MANAGER_WORKERS_QUERY_KEY = ['mess-manager', 'workers'];

const WorkerListSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={`worker-skeleton-${index}`}
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
            style={{ width: '40%', height: 16, marginBottom: 10 }}
          />
          <div className="ui-skeleton ui-skeleton-text" style={{ width: '72%', height: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="ui-skeleton ui-skeleton-card" style={{ width: 36, height: 36 }} />
          <div className="ui-skeleton ui-skeleton-card" style={{ width: 36, height: 36 }} />
        </div>
      </div>
    ))}
  </div>
);

const MessManagerDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mess');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '' });
  const [addResult, setAddResult] = useState(null);
  const [addError, setAddError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isWorkersTab = activeTab === 'workers';
  const {
    data: workers = [],
    isLoading: isLoadingWorkers,
  } = useQuery({
    queryKey: MESS_MANAGER_WORKERS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/manager/mess-workers/');
      return Array.isArray(data) ? data : [];
    },
    enabled: isWorkersTab,
  });

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

  const refreshWorkers = useCallback(
    async () => queryClient.invalidateQueries({ queryKey: MESS_MANAGER_WORKERS_QUERY_KEY }),
    [queryClient]
  );

  const handleAddWorker = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setAddError('');
    setAddResult(null);

    try {
      const { data } = await api.post('/manager/mess-workers/', addForm);
      setAddResult(data);
      setAddForm({ full_name: '', email: '', phone: '' });
      await refreshWorkers();
    } catch (error) {
      setAddError(
        error.response?.data?.detail ||
          error.response?.data?.email?.[0] ||
          'Unable to create worker.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (userId) => {
    try {
      await api.patch(`/manager/mess-workers/${userId}/toggle/`);
      await refreshWorkers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to toggle status.');
    }
  };

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Delete worker ${email}?`)) {
      return;
    }

    try {
      await api.delete(`/manager/mess-workers/${userId}/toggle/`);
      await refreshWorkers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to delete worker.');
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Log out?')) {
      return;
    }

    await logoutUser();
    navigate('/auth');
  };

  const messCards = [
    {
      icon: <UtensilsCrossed size={22} />,
      title: 'Weekly Extras Menu',
      desc: 'Add, edit, or remove extras for the weekly mess menu.',
      route: '/manager/mess/menu',
    },
    {
      icon: <ClipboardList size={22} />,
      title: "Today's Bookings",
      desc: "View today's bookings and redemption stats.",
      route: '/manager/mess/bookings',
    },
    {
      icon: <Users size={22} />,
      title: 'Crowd Monitoring',
      desc: 'View live crowd density and manage your mess camera video feed IPs.',
      route: '/manager/crowd',
    },
  ];

  const navItems = [
    { id: 'mess', icon: <Settings size={20} />, label: 'Manage Mess' },
    { id: 'workers', icon: <Users size={20} />, label: 'Manage Workers' },
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
    if (isWorkersTab) {
      await refreshWorkers();
    }
  }, [isWorkersTab, refreshWorkers]);

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
              color: '#d55555',
              padding: '0 20px',
              marginBottom: 32,
            }}
          >
            Mess Manager
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
                    activeTab === item.id ? '3px solid #d55555' : '3px solid transparent',
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
              color: '#d55555',
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
          {activeTab === 'mess' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Manage Mess</h1>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                {messCards.map((card) => (
                  <div
                    key={card.route}
                    className="mess-feature-card"
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
                          color: '#d55555',
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
            </div>
          )}

          {activeTab === 'workers' && (
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
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Manage Workers</h1>
                <button
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setAddResult(null);
                    setAddError('');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: showAddForm ? '#333' : '#d55555',
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
                      <Plus size={16} /> Add Worker
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
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Worker</h3>
                  <form
                    onSubmit={handleAddWorker}
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
                        background: '#d55555',
                        border: 'none',
                        borderRadius: 10,
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        opacity: submitting ? 0.6 : 1,
                      }}
                    >
                      {submitting ? 'Creating...' : 'Create Worker'}
                    </button>
                  </form>

                  {addError ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#331111',
                        border: '1px solid #d55555',
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
                        Worker created
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
                        Credentials have also been sent via email.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {isLoadingWorkers && workers.length === 0 ? (
                <WorkerListSkeleton />
              ) : workers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>👷</div>
                  <p>No workers assigned yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
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
                          <h3 style={{ fontSize: 15, fontWeight: 600 }}>{worker.full_name}</h3>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: worker.is_active ? '#112211' : '#331111',
                              color: worker.is_active ? '#33aa33' : '#ff6b6b',
                              border: `1px solid ${
                                worker.is_active ? '#33aa33' : '#ff6b6b'
                              }`,
                              textTransform: 'uppercase',
                            }}
                          >
                            {worker.is_active ? 'Active' : 'Frozen'}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#999' }}>
                          {worker.email} · {worker.employee_code}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleToggle(worker.id)}
                          title={worker.is_active ? 'Freeze' : 'Activate'}
                          style={{
                            width: 36,
                            height: 36,
                            background: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: 8,
                            color: worker.is_active ? '#33aa33' : '#ff6b6b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {worker.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => handleDelete(worker.id, worker.email)}
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
                color: activeTab === item.id ? '#d55555' : '#999',
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

export default MessManagerDashboard;
