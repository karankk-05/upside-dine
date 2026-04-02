import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminManagerDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);

  const [activeTab, setActiveTab] = useState('overview');
  const [managers, setManagers] = useState([]);
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddMessForm, setShowAddMessForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role_name: 'mess_manager',
    canteen_id: '',
    mess_id: '',
  });
  const [messFormData, setMessFormData] = useState({ hall_name: '' });
  const [canteenFormData, setCanteenFormData] = useState({ name: '', location: '' });
  const [showAddCanteenForm, setShowAddCanteenForm] = useState(false);
  const [canteens, setCanteens] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [availableCanteens, setAvailableCanteens] = useState([]);
  const [availableMesses, setAvailableMesses] = useState([]);

  useEffect(() => {
    // Fetch available canteens and messes on mount for the manager creation dropdowns
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.get('/api/admin/messes/', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setAvailableMesses(res.data)).catch(() => {});
      axios.get('/api/admin/canteens/', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setAvailableCanteens(res.data)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'managers') {
      fetchManagers();
    } else if (activeTab === 'messes') {
      fetchMesses();
    } else if (activeTab === 'canteens') {
      fetchCanteens();
    }
  }, [activeTab]);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/admin/managers/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Managers currently not available' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        role_name: formData.role_name,
      };
      
      // Add assignment ID based on role
      if (formData.role_name === 'canteen_manager' && formData.canteen_id) {
        payload.canteen_id = parseInt(formData.canteen_id);
      }
      if (formData.role_name === 'mess_manager' && formData.mess_id) {
        payload.mess_id = parseInt(formData.mess_id);
      }
      
      const response = await axios.post('/api/admin/managers/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ 
        type: 'success', 
        text: `Manager created! Email: ${response.data.email}, Employee Code: ${response.data.employee_code}. Credentials have been sent via email.` 
      });
      setFormData({ email: '', full_name: '', phone: '', role_name: 'mess_manager', canteen_id: '', mess_id: '' });
      setShowAddForm(false);
      fetchManagers();
    } catch (error) {
      console.error('Error creating manager:', error.response?.data);
      let errorMsg = 'Unable to create manager';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.email) errorMsg = `Email error: ${data.email[0] || data.email}`;
        else if (data.phone) errorMsg = `Phone error: ${data.phone[0] || data.phone}`;
        else if (data.full_name) errorMsg = `Name error: ${data.full_name[0] || data.full_name}`;
        else if (data.role_name) errorMsg = `Role error: ${data.role_name[0] || data.role_name}`;
        else if (data.canteen_id) errorMsg = `Canteen error: ${data.canteen_id[0] || data.canteen_id}`;
        else if (data.mess_id) errorMsg = `Mess error: ${data.mess_id[0] || data.mess_id}`;
        else if (data.detail) errorMsg = data.detail;
        else if (typeof data === 'string') errorMsg = data;
      }
      
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`/api/admin/managers/${userId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchManagers();
      setMessage({ 
        type: 'success', 
        text: `Manager ${currentStatus ? 'frozen' : 'activated'} successfully` 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to update status' });
    }
  };

  const fetchMesses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/admin/messes/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMesses(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Messes currently not available' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMess = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('/api/admin/messes/', messFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: `Mess created: ${response.data.name}` });
      setMessFormData({ hall_name: '' });
      setShowAddMessForm(false);
      fetchMesses();
    } catch (error) {
      const errMsg = error.response?.data?.hall_name?.[0] || error.response?.data?.detail || 'Unable to create mess';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMess = async (messId, currentStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`/api/admin/messes/${messId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMesses();
      setMessage({ type: 'success', text: `Mess ${currentStatus ? 'frozen' : 'activated'} successfully` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to update mess status' });
    }
  };

  const handleDeleteMess = async (messId) => {
    if (!window.confirm("Are you sure you want to delete this mess?")) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`/api/admin/messes/${messId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMesses();
      setMessage({ type: 'success', text: 'Mess deleted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to delete mess' });
    }
  };

  const fetchCanteens = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/admin/canteens/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCanteens(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Canteens currently not available' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCanteen = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('/api/admin/canteens/', canteenFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: `Canteen created: ${response.data.name}` });
      setCanteenFormData({ name: '', location: '', opening_time: '08:00', closing_time: '22:00' });
      setShowAddCanteenForm(false);
      fetchCanteens();
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to create canteen' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCanteen = async (canteenId, currentStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`/api/admin/canteens/${canteenId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCanteens();
      setMessage({ type: 'success', text: `Canteen ${currentStatus ? 'frozen' : 'activated'} successfully` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to update canteen status' });
    }
  };

  const handleDeleteCanteen = async (canteenId) => {
    if (!window.confirm("Are you sure you want to delete this canteen?")) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`/api/admin/canteens/${canteenId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCanteens();
      setMessage({ type: 'success', text: 'Canteen deleted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to delete canteen' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '10px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#d63434', marginBottom: '20px', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Admin Manager Dashboard</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #333', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 15px',
              background: activeTab === 'overview' ? '#d63434' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '3px solid #d63434' : 'none',
              whiteSpace: 'nowrap',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('managers')}
            style={{
              padding: '10px 15px',
              background: activeTab === 'managers' ? '#d63434' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'managers' ? '3px solid #d63434' : 'none',
              whiteSpace: 'nowrap',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)'
            }}
          >
            Manage Managers
          </button>
          <button
            onClick={() => setActiveTab('messes')}
            style={{
              padding: '10px 15px',
              background: activeTab === 'messes' ? '#d63434' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'messes' ? '3px solid #d63434' : 'none',
              whiteSpace: 'nowrap',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)'
            }}
          >
            Manage Messes
          </button>
          <button
            onClick={() => setActiveTab('canteens')}
            style={{
              padding: '10px 15px',
              background: activeTab === 'canteens' ? '#d63434' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'canteens' ? '3px solid #d63434' : 'none',
              whiteSpace: 'nowrap',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)'
            }}
          >
            Manage Canteens
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            background: message.type === 'success' ? '#1a4d1a' : '#4d1a1a',
            border: `1px solid ${message.type === 'success' ? '#2d7a2d' : '#7a2d2d'}`,
            borderRadius: '5px',
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            wordBreak: 'break-word'
          }}>
            {message.text}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>Welcome to Admin Manager Dashboard</h2>
            <p style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Manage canteen and mess managers from here.</p>
          </div>
        )}

        {/* Managers Tab */}
        {activeTab === 'managers' && (
          <div>
            <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', marginBottom: '20px', gap: '10px' }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', margin: 0 }}>Manager Management</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  padding: '10px 20px',
                  background: '#d63434',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
              >
                {showAddForm ? 'Cancel' : '+ Add Manager'}
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <form onSubmit={handleAddManager} style={{
                background: '#1a1a1a',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginBottom: '15px', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>Add New Manager</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    style={{
                      padding: '10px',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      color: '#fff',
                      borderRadius: '5px',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{
                      padding: '10px',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      color: '#fff',
                      borderRadius: '5px',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    style={{
                      padding: '10px',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      color: '#fff',
                      borderRadius: '5px',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  />
                  <select
                    value={formData.role_name}
                    onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                    style={{
                      padding: '10px',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      color: '#fff',
                      borderRadius: '5px',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  >
                    <option value="mess_manager">Mess Manager</option>
                    <option value="canteen_manager">Canteen Manager</option>
                  </select>
                  {formData.role_name === 'canteen_manager' && (
                    <select
                      value={formData.canteen_id}
                      onChange={(e) => setFormData({ ...formData, canteen_id: e.target.value })}
                      required
                      style={{
                        padding: '10px',
                        background: '#0a0a0a',
                        border: '1px solid #333',
                        color: '#fff',
                        borderRadius: '5px',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                      }}
                    >
                      <option value="">Select Canteen / Outlet</option>
                      {availableCanteens.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                      ))}
                    </select>
                  )}
                  {formData.role_name === 'mess_manager' && (
                    <select
                      value={formData.mess_id}
                      onChange={(e) => setFormData({ ...formData, mess_id: e.target.value })}
                      required
                      style={{
                        padding: '10px',
                        background: '#0a0a0a',
                        border: '1px solid #333',
                        color: '#fff',
                        borderRadius: '5px',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                      }}
                    >
                      <option value="">Select Mess</option>
                      {availableMesses.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px',
                      background: '#d63434',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Manager'}
                  </button>
                </div>
              </form>
            )}

            {/* Managers List */}
            {loading && !showAddForm ? (
              <p>Loading...</p>
            ) : (
              <div style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'auto' }}>
                {/* Mobile View - Cards */}
                <div style={{ display: window.innerWidth < 768 ? 'block' : 'none' }}>
                  {managers.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No managers found. Add one to get started.
                    </p>
                  ) : (
                    managers.map((manager) => (
                      <div key={manager.id} style={{
                        padding: '15px',
                        borderBottom: '1px solid #333',
                        background: '#0a0a0a',
                        margin: '10px',
                        borderRadius: '8px'
                      }}>
                        <div style={{ marginBottom: '10px' }}>
                          <strong style={{ color: '#d63434' }}>{manager.full_name}</strong>
                        </div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '5px' }}>
                          <span style={{ color: '#888' }}>Email:</span> {manager.email}
                        </div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '5px' }}>
                          <span style={{ color: '#888' }}>Phone:</span> {manager.phone}
                        </div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '5px' }}>
                          <span style={{ color: '#888' }}>Role:</span> {manager.role_name}
                        </div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '5px' }}>
                          <span style={{ color: '#888' }}>Code:</span> {manager.employee_code}
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{
                            padding: '5px 10px',
                            borderRadius: '5px',
                            background: manager.is_active ? '#1a4d1a' : '#4d1a1a',
                            color: manager.is_active ? '#4ade80' : '#f87171',
                            fontSize: '0.875rem'
                          }}>
                            {manager.is_active ? 'Active' : 'Frozen'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleToggleStatus(manager.id, manager.is_active)}
                            style={{
                              padding: '8px 15px',
                              background: manager.is_active ? '#7a2d2d' : '#2d7a2d',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              flex: '1'
                            }}
                          >
                            {manager.is_active ? 'Freeze' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop View - Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', display: window.innerWidth < 768 ? 'none' : 'table' }}>
                  <thead>
                    <tr style={{ background: '#0a0a0a' }}>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Role</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Employee Code</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          No managers found. Add one to get started.
                        </td>
                      </tr>
                    ) : (
                      managers.map((manager) => (
                        <tr key={manager.id} style={{ borderTop: '1px solid #333' }}>
                          <td style={{ padding: '15px' }}>{manager.full_name}</td>
                          <td style={{ padding: '15px' }}>{manager.email}</td>
                          <td style={{ padding: '15px' }}>{manager.phone}</td>
                          <td style={{ padding: '15px' }}>{manager.role_name}</td>
                          <td style={{ padding: '15px' }}>{manager.employee_code}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              background: manager.is_active ? '#1a4d1a' : '#4d1a1a',
                              color: manager.is_active ? '#4ade80' : '#f87171'
                            }}>
                              {manager.is_active ? 'Active' : 'Frozen'}
                            </span>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <button
                              onClick={() => handleToggleStatus(manager.id, manager.is_active)}
                              style={{
                                padding: '8px 15px',
                                background: manager.is_active ? '#7a2d2d' : '#2d7a2d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              {manager.is_active ? 'Freeze' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Messes Tab */}
        {activeTab === 'messes' && (
          <div>
            <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', marginBottom: '20px', gap: '10px' }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', margin: 0 }}>Mess Management</h2>
              <button
                onClick={() => setShowAddMessForm(!showAddMessForm)}
                style={{
                  padding: '10px 20px',
                  background: '#d63434',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
              >
                {showAddMessForm ? 'Cancel' : '+ Add Mess'}
              </button>
            </div>

            {/* Add Mess Form */}
            {showAddMessForm && (
              <form onSubmit={handleAddMess} style={{
                background: '#1a1a1a',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginBottom: '15px', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>Create Mess for Hall</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="E.g. Hall 15, Girls Hostel"
                    value={messFormData.hall_name}
                    onChange={(e) => setMessFormData({ hall_name: e.target.value })}
                    required
                    style={{
                      padding: '10px',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      color: '#fff',
                      borderRadius: '5px',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px',
                      background: '#d63434',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Mess'}
                  </button>
                </div>
              </form>
            )}

            {/* Messes List */}
            {loading && !showAddMessForm ? (
              <p>Loading...</p>
            ) : (
              <div style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'auto' }}>
                {messes.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No messes created yet. Add one to get started.
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#0a0a0a' }}>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Mess Name</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Hall</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messes.map((mess) => (
                        <tr key={mess.id} style={{ borderTop: '1px solid #333' }}>
                          <td style={{ padding: '15px' }}>{mess.name}</td>
                          <td style={{ padding: '15px' }}>{mess.hall_display}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              background: mess.is_active ? '#1a4d1a' : '#4d1a1a',
                              color: mess.is_active ? '#4ade80' : '#f87171'
                            }}>
                              {mess.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleToggleMess(mess.id, mess.is_active)}
                              style={{
                                padding: '8px 15px',
                                background: mess.is_active ? '#7a2d2d' : '#2d7a2d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              {mess.is_active ? 'Freeze' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteMess(mess.id)}
                              style={{
                                padding: '8px 15px',
                                background: 'transparent',
                                color: '#f87171',
                                border: '1px solid #7a2d2d',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* Canteens Tab */}
        {activeTab === 'canteens' && (
          <div>
            <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', marginBottom: '20px', gap: '10px' }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', margin: 0 }}>Canteen Management</h2>
              <button
                onClick={() => setShowAddCanteenForm(!showAddCanteenForm)}
                style={{
                  padding: '10px 20px',
                  background: '#d63434',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
              >
                {showAddCanteenForm ? 'Cancel' : '+ Add Canteen'}
              </button>
            </div>

            {/* Add Canteen Form */}
            {showAddCanteenForm && (
              <form onSubmit={handleAddCanteen} style={{
                background: '#1a1a1a',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginBottom: '15px', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>Create Canteen / Outlet</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={canteenFormData.name}
                    onChange={(e) => setCanteenFormData({ ...canteenFormData, name: e.target.value })}
                    required
                    style={{
                      padding: '10px',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      color: '#fff',
                      borderRadius: '5px',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={canteenFormData.location}
                    onChange={(e) => setCanteenFormData({ ...canteenFormData, location: e.target.value })}
                    required
                    style={{
                      padding: '10px',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      color: '#fff',
                      borderRadius: '5px',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px',
                      background: '#d63434',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Canteen'}
                  </button>
                </div>
              </form>
            )}

            {/* Canteens List */}
            {loading && !showAddCanteenForm ? (
              <p>Loading...</p>
            ) : (
              <div style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'auto' }}>
                {canteens.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No canteens created yet. Add one to get started.
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#0a0a0a' }}>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Location</th>

                        <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {canteens.map((canteen) => (
                        <tr key={canteen.id} style={{ borderTop: '1px solid #333' }}>
                          <td style={{ padding: '15px' }}>{canteen.name}</td>
                          <td style={{ padding: '15px' }}>{canteen.location}</td>

                          <td style={{ padding: '15px' }}>
                            <span style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              background: canteen.is_active ? '#1a4d1a' : '#4d1a1a',
                              color: canteen.is_active ? '#4ade80' : '#f87171'
                            }}>
                              {canteen.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleToggleCanteen(canteen.id, canteen.is_active)}
                              style={{
                                padding: '8px 15px',
                                background: canteen.is_active ? '#7a2d2d' : '#2d7a2d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              {canteen.is_active ? 'Freeze' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteCanteen(canteen.id)}
                              style={{
                                padding: '8px 15px',
                                background: 'transparent',
                                color: '#f87171',
                                border: '1px solid #7a2d2d',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagerDashboard;
