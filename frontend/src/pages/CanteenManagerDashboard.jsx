import { useState, useEffect } from 'react';
import axios from 'axios';

const CanteenManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (activeTab === 'delivery') {
      fetchDeliveryPersonnel();
    }
  }, [activeTab]);

  const fetchDeliveryPersonnel = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/manager/delivery-personnel/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveryPersonnel(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load delivery personnel' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeliveryPerson = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('/api/manager/delivery-personnel/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ 
        type: 'success', 
        text: `Delivery person created! Temp password: ${response.data.temp_password}` 
      });
      setFormData({ email: '', full_name: '', phone: '' });
      setShowAddForm(false);
      fetchDeliveryPersonnel();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.email?.[0] || 'Failed to create delivery person' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`/api/manager/delivery-personnel/${userId}/toggle/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDeliveryPersonnel();
      setMessage({ 
        type: 'success', 
        text: `Delivery person ${currentStatus ? 'deactivated' : 'activated'} successfully` 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '10px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#d63434', marginBottom: '20px', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Canteen Manager Dashboard</h1>

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
            onClick={() => setActiveTab('delivery')}
            style={{
              padding: '10px 15px',
              background: activeTab === 'delivery' ? '#d63434' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'delivery' ? '3px solid #d63434' : 'none',
              whiteSpace: 'nowrap',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)'
            }}
          >
            Delivery Personnel
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
            <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>Welcome to Canteen Manager Dashboard</h2>
            <p style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Manage your canteen operations and delivery personnel from here.</p>
          </div>
        )}

        {/* Delivery Personnel Tab */}
        {activeTab === 'delivery' && (
          <div>
            <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', marginBottom: '20px', gap: '10px' }}>
              <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', margin: 0 }}>Delivery Personnel Management</h2>
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
                {showAddForm ? 'Cancel' : '+ Add Delivery Person'}
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <form onSubmit={handleAddDeliveryPerson} style={{
                background: '#1a1a1a',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginBottom: '15px', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>Add New Delivery Person</h3>
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
                    {loading ? 'Creating...' : 'Create Delivery Person'}
                  </button>
                </div>
              </form>
            )}

            {/* Delivery Personnel List */}
            {loading && !showAddForm ? (
              <p>Loading...</p>
            ) : (
              <div style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'auto' }}>
                {/* Mobile View - Cards */}
                <div style={{ display: window.innerWidth < 768 ? 'block' : 'none' }}>
                  {deliveryPersonnel.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No delivery personnel found. Add one to get started.
                    </p>
                  ) : (
                    deliveryPersonnel.map((person) => (
                      <div key={person.id} style={{
                        padding: '15px',
                        borderBottom: '1px solid #333',
                        background: '#0a0a0a',
                        margin: '10px',
                        borderRadius: '8px'
                      }}>
                        <div style={{ marginBottom: '10px' }}>
                          <strong style={{ color: '#d63434' }}>{person.full_name}</strong>
                        </div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '5px' }}>
                          <span style={{ color: '#888' }}>Email:</span> {person.email}
                        </div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '5px' }}>
                          <span style={{ color: '#888' }}>Phone:</span> {person.phone}
                        </div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '5px' }}>
                          <span style={{ color: '#888' }}>Code:</span> {person.employee_code}
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{
                            padding: '5px 10px',
                            borderRadius: '5px',
                            background: person.is_active ? '#1a4d1a' : '#4d1a1a',
                            color: person.is_active ? '#4ade80' : '#f87171',
                            fontSize: '0.875rem'
                          }}>
                            {person.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleToggleStatus(person.id, person.is_active)}
                            style={{
                              padding: '8px 15px',
                              background: person.is_active ? '#7a2d2d' : '#2d7a2d',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              flex: '1'
                            }}
                          >
                            {person.is_active ? 'Deactivate' : 'Activate'}
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
                      <th style={{ padding: '15px', textAlign: 'left' }}>Employee Code</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryPersonnel.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          No delivery personnel found. Add one to get started.
                        </td>
                      </tr>
                    ) : (
                      deliveryPersonnel.map((person) => (
                        <tr key={person.id} style={{ borderTop: '1px solid #333' }}>
                          <td style={{ padding: '15px' }}>{person.full_name}</td>
                          <td style={{ padding: '15px' }}>{person.email}</td>
                          <td style={{ padding: '15px' }}>{person.phone}</td>
                          <td style={{ padding: '15px' }}>{person.employee_code}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              background: person.is_active ? '#1a4d1a' : '#4d1a1a',
                              color: person.is_active ? '#4ade80' : '#f87171'
                            }}>
                              {person.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <button
                              onClick={() => handleToggleStatus(person.id, person.is_active)}
                              style={{
                                padding: '8px 15px',
                                background: person.is_active ? '#7a2d2d' : '#2d7a2d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              {person.is_active ? 'Deactivate' : 'Activate'}
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
      </div>
    </div>
  );
};

export default CanteenManagerDashboard;
