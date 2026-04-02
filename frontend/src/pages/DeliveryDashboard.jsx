import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../features/canteen/canteen.css';

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);

  // Mock data matching the design
  const stats = {
    deliveries: 8,
    earnings: 640
  };

  const currentDelivery = {
    id: '#CN48389',
    status: 'In Progress',
    items: 'Dosa, Tea',
    pickup: 'Hall 12 Canteen',
    customerName: 'Indranil Saha',
    customerLocation: 'RM 408',
    customerPhone: '+91 98765 43210'
  };

  const availableOrders = [
    {
      id: '#CN48394',
      status: 'Ready',
      items: 'Samosa, Chai',
      route: '📍 MT Canteen → Hall 12',
      fee: 20,
      meta: 'Distance: 0.8 km • Est. 5 mins'
    },
    {
      id: '#CN48395',
      status: 'Ready',
      items: 'Maggi, Bread Omelette',
      route: '📍 KC Canteen → RM214, Hall 9',
      fee: 25,
      meta: 'Distance: 1.2 km • Est. 8 mins'
    },
    {
      id: '#CN48396',
      status: 'Preparing',
      items: 'Paratha, Chai',
      route: '📍 Nescafe → Rohan Kumar (RM112, Hall 12)',
      fee: 15,
      meta: 'Distance: 0.5 km • Ready in ~5 mins'
    }
  ];

  const toggleOnline = () => {
    setIsOnline(!isOnline);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '428px', margin: '0 auto', background: '#000', minHeight: '100vh', position: 'relative' }}>
        
        {/* Page Header */}
        <div style={{ padding: '40px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#d45555', textShadow: '0 0 4px rgba(232,85,85,0.12)' }}>
            Delivery Dashboard
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

        <div style={{ padding: '0 20px' }}>
          {/* Stats & Status Overview */}
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>Status</p>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: isOnline ? '#00ff00' : '#ff3333' }}>
                  {isOnline ? 'Active' : 'Offline'}
                </h2>
              </div>
              <button onClick={toggleOnline} 
                style={{ 
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                  background: isOnline ? '#331111' : '#113311',
                  color: isOnline ? '#ff6b6b' : '#33aa33',
                  border: `1px solid ${isOnline ? '#ff6b6b' : '#33aa33'}`,
                  transition: 'all 0.2s'
                }}>
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #333', paddingTop: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#d45555' }}>{stats.deliveries}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Today's Deliveries</div>
              </div>
              <div style={{ width: 1, background: '#333' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#d45555' }}>₹{stats.earnings}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Today's Earnings</div>
              </div>
            </div>
          </div>

          {/* Current Delivery */}
          {isOnline && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Current Delivery</h3>
              
              <div style={{ background: '#1a1a1a', border: '1px solid #d45555', borderRadius: 16, padding: 16, boxShadow: '0 0 15px rgba(232,85,85,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{currentDelivery.id}</span>
                  <span style={{ background: '#331133', color: '#b566ff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {currentDelivery.status}
                  </span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{currentDelivery.items}</p>

                {/* Pickup & Delivery Info */}
                <div style={{ background: '#111', borderRadius: 8, padding: 12, marginBottom: 16, border: '1px solid #222' }}>
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>📍 Pickup from:</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{currentDelivery.pickup}</p>
                  </div>
                  <div style={{ height: 1, background: '#222', margin: '8px 0' }}></div>
                  <div>
                    <p style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>🏠 Deliver to:</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{currentDelivery.customerName}</p>
                    <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{currentDelivery.customerLocation}</p>
                    <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Phone: {currentDelivery.customerPhone}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => alert('Delivery completed!')} style={{ flex: 1, padding: '12px', background: '#d45555', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Mark Delivered
                  </button>
                  <button style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    Call Customer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Available Orders */}
          {isOnline && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Available Orders</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {availableOrders.map(order => (
                  <div key={order.id} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{order.id}</span>
                      <span style={{ 
                        background: order.status === 'Ready' ? '#113311' : '#332211', 
                        color: order.status === 'Ready' ? '#33aa33' : '#ffaa00', 
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 
                      }}>
                        {order.status}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{order.items}</p>
                    <p style={{ fontSize: 13, color: '#ddd', marginBottom: 4 }}>{order.route}</p>
                    <p style={{ fontSize: 13, color: '#d45555', fontWeight: 600, marginBottom: 8 }}>💰 Delivery Fee: ₹{order.fee}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                      <p style={{ fontSize: 11, color: '#999' }}>{order.meta}</p>
                      {order.status === 'Ready' && (
                        <button onClick={() => alert('Order accepted!')} style={{ padding: '8px 16px', background: '#d45555', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Accept
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline State */}
          {!isOnline && (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: '#1a1a1a', border: '1px dashed #444', borderRadius: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📴</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>You are offline</h3>
              <p style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>Go online to start receiving and accepting delivery orders.</p>
              <button onClick={toggleOnline} style={{ padding: '10px 24px', background: '#d45555', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Go Online Now
              </button>
            </div>
          )}

          {/* Delivery History */}
          <div style={{ marginTop: 32, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Today's History (8)</h3>
            <a href="#" style={{ color: '#d45555', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View All →</a>
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          maxWidth: 428, width: '100%', background: '#000', borderTop: '1px solid #333',
          display: 'flex', justifyContent: 'space-around', padding: '12px 0', zIndex: 100,
        }}>
          <a href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#d45555', textDecoration: 'none', fontSize: 11, padding: '8px 20px' }}>
            <span style={{ fontSize: 20 }}>🏠</span>Home
          </a>
          <a href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#666', textDecoration: 'none', fontSize: 11, padding: '8px 20px' }}>
            <span style={{ fontSize: 20 }}>📦</span>Orders
          </a>
          <a href="#" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#666', textDecoration: 'none', fontSize: 11, padding: '8px 20px' }}>
            <span style={{ fontSize: 20 }}>💰</span>Earnings
          </a>
        </nav>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
