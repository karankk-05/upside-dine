import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck } from 'lucide-react';
import { useManagerOrderDetail } from '../hooks/useManagerOrderDetail';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import OrderStatusTracker from '../components/OrderStatusTracker';
import api from '../../../lib/api';
import '../canteen.css';

export default function ManagerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, refetch } = useManagerOrderDetail(id);
  const { mutateAsync: updateStatus } = useUpdateOrderStatus();

  // OTP state
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Delivery coordinator assignment state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchDeliveryPersonnel = async () => {
    setLoadingPersonnel(true);
    try {
      const res = await api.get('/manager/delivery-personnel/');
      setDeliveryPersonnel(res.data || []);
    } catch {
      setDeliveryPersonnel([]);
    } finally {
      setLoadingPersonnel(false);
    }
  };

  const handleStatusUpdate = async (newStatus, extraData = {}) => {
    try {
      await updateStatus({ id, status: newStatus, ...extraData });
      refetch();
      setShowAssignModal(false);
    } catch (err) {
      const errData = err.response?.data;
      const msg = typeof errData === 'object' ? JSON.stringify(errData) : (errData?.detail || 'Failed to update');
      alert(msg);
    }
  };

  const handleAssignDelivery = async (dpId) => {
    setAssigning(true);
    try {
      await updateStatus({ id, status: 'out_for_delivery', delivery_person_id: dpId });
      refetch();
      setShowAssignModal(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleVerifyPickup = async () => {
    if (otpInput.length !== 6) { setOtpError('Enter 6-digit OTP'); return; }
    setVerifying(true);
    setOtpError('');
    try {
      await api.post(`/canteen-manager/orders/${id}/verify-pickup/`, { pickup_otp: otpInput });
      refetch();
    } catch (err) {
      setOtpError(err.response?.data?.pickup_otp || err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading) return <div className="canteen-page"><div className="canteen-loading"><div className="canteen-loading-spinner" /></div></div>;
  if (!order) return <div className="canteen-page"><div className="canteen-empty"><p className="canteen-empty__text">Order not found</p></div></div>;

  const isPickup = order.order_type !== 'delivery';

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">Order #{order.order_number || order.id}</h1>
      </div>

      <div style={{ padding: 20 }}>
        {/* Status + Type */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
            background: order.order_type === 'delivery' ? '#220044' : '#222',
            color: order.order_type === 'delivery' ? '#b566ff' : '#aaa',
            textTransform: 'uppercase',
          }}>
            {order.order_type || 'pickup'}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 8,
            background: order.status === 'pending' ? '#331111' : order.status === 'preparing' ? '#332200' : order.status === 'ready' ? '#003311' : '#1a1a1a',
            color: order.status === 'pending' ? '#ff6b6b' : order.status === 'preparing' ? '#ffaa33' : order.status === 'ready' ? '#00ff66' : '#999',
            border: '1px solid',
          }}>
            {order.status?.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Items */}
        <div style={{ background: '#1a1a1a', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #333' }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#ccc' }}>Order Items</p>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: '#eee' }}>
              <span>{item.menu_item_name || item.item_name || item.name} × {item.quantity}</span>
              <span style={{ color: '#d45555', fontWeight: 600 }}>₹{item.total_price || (item.unit_price || item.price) * item.quantity}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #333', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
            <span>Total</span>
            <span style={{ color: '#d45555' }}>₹{order.total_amount}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div style={{ background: '#1a1a1a', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #333' }}>
          {order.delivery_address && <p style={{ fontSize: 13, color: '#ddd', marginBottom: 4 }}>📍 {order.delivery_address}</p>}
          {order.notes && <p style={{ fontSize: 13, color: '#ddd', marginBottom: 4 }}>📝 {order.notes}</p>}
          {order.estimated_ready_time && (
            <p style={{ fontSize: 13, color: '#ddd' }}>⏱ ETA: {new Date(order.estimated_ready_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          )}
        </div>

        {order.order_type === 'delivery' && (
          <div style={{ background: '#1a1a1a', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #b566ff' }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#b566ff' }}>Delivery Coordinator</p>
            {order.delivery_person_name ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, background: '#220044', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                }}>🚴</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#eee' }}>{order.delivery_person_name}</p>
                  {order.delivery_person_phone && (
                    <p style={{ fontSize: 12, color: '#b566ff', marginTop: 2 }}>📞 {order.delivery_person_phone}</p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, background: '#111', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  border: '1px solid #333'
                }}>⏳</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#999' }}>Waiting for coordinator...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {order.status === 'pending' && (
            <>
              <button onClick={() => handleStatusUpdate('confirmed')} style={{
                flex: 1, padding: 14, background: '#d45555', color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>✅ Accept Order</button>
              <button onClick={() => handleStatusUpdate('rejected')} style={{
                padding: '14px 20px', background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b',
                borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>✕ Reject</button>
            </>
          )}
          {order.status === 'confirmed' && (
            <button onClick={() => handleStatusUpdate('preparing')} style={{
              flex: 1, padding: 14, background: '#332200', color: '#ffaa33', border: '1px solid #ffaa33',
              borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>🍳 Start Preparing</button>
          )}
          {order.status === 'preparing' && (
            <button onClick={() => handleStatusUpdate('ready')} style={{
              flex: 1, padding: 14, background: '#003311', color: '#00ff66', border: '1px solid #00ff66',
              borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>📦 Mark Ready</button>
          )}
          {order.status === 'ready' && !isPickup && (
            <button onClick={() => { setShowAssignModal(true); fetchDeliveryPersonnel(); }} style={{
              flex: 1, padding: 14, background: '#220033', color: '#b566ff', border: '1px solid #b566ff',
              borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>🚴 Assign Delivery Coordinator</button>
          )}
        </div>

        {/* OTP Verification for Pickup */}
        {isPickup && order.status === 'ready' && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)',
            border: '2px solid #d45555', borderRadius: 16, padding: 24,
            textAlign: 'center', boxShadow: '0 0 30px rgba(212, 85, 85, 0.1)', marginBottom: 20,
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📦 Verify Pickup</p>
            <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>Enter the 6-digit OTP from the student's app</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input key={i} maxLength={1} value={otpInput[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/, '');
                    const arr = otpInput.split(''); arr[i] = val;
                    setOtpInput(arr.join('')); setOtpError('');
                    if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpInput[i] && e.target.previousElementSibling) e.target.previousElementSibling.focus();
                  }}
                  style={{
                    width: 40, height: 48, textAlign: 'center', fontSize: 20, fontWeight: 700,
                    background: '#000', color: '#d45555', border: otpError ? '2px solid #ff3333' : '2px solid #d45555',
                    borderRadius: 8, outline: 'none', fontFamily: 'monospace',
                  }}
                />
              ))}
            </div>
            {otpError && <p style={{ color: '#ff3333', fontSize: 12, marginBottom: 8 }}>{otpError}</p>}
            <button onClick={handleVerifyPickup} disabled={verifying || otpInput.length < 6} style={{
              width: '100%', padding: 14, background: verifying ? '#333' : '#d45555',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: verifying ? 'not-allowed' : 'pointer',
            }}>{verifying ? 'Verifying...' : '✅ Confirm Pickup'}</button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <OrderStatusTracker status={order.status} orderType={order.order_type} />

      {/* Delivery Coordinator Assignment Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={() => setShowAssignModal(false)} style={{ position: 'absolute', inset: 0 }} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 428, maxHeight: '70vh',
            background: '#111', borderRadius: '20px 20px 0 0', padding: 24, overflowY: 'auto',
            border: '1px solid #333', borderBottom: 'none',
          }}>
            <div style={{ width: 40, height: 4, background: '#444', borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={20} color="#b566ff" /> Assign Delivery
            </h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Select a delivery coordinator for this order</p>

            {loadingPersonnel ? (
              <div className="canteen-loading" style={{ padding: 40 }}><div className="canteen-loading-spinner" /></div>
            ) : deliveryPersonnel.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
                <p style={{ color: '#888', fontSize: 14 }}>No delivery personnel available</p>
                <p style={{ color: '#666', fontSize: 12, marginTop: 4 }}>Add delivery coordinators from the manager dashboard</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {deliveryPersonnel.map((dp) => (
                  <button key={dp.id} disabled={assigning} onClick={() => handleAssignDelivery(dp.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 16, background: '#1a1a1a', border: '1px solid #333', borderRadius: 12,
                    cursor: assigning ? 'not-allowed' : 'pointer', transition: 'all 0.2s', color: '#fff',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, background: '#220044', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>🚴</div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{dp.full_name || dp.email}</p>
                        <p style={{ fontSize: 11, color: '#888' }}>{dp.phone_number || dp.email}</p>
                      </div>
                    </div>
                    <span style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: dp.is_active ? '#112211' : '#331111',
                      color: dp.is_active ? '#66cc66' : '#ff6b6b',
                      border: `1px solid ${dp.is_active ? '#66cc66' : '#ff6b6b'}`,
                    }}>
                      {dp.is_active ? 'Available' : 'Offline'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => setShowAssignModal(false)} style={{
              width: '100%', marginTop: 20, padding: 14, background: '#222', color: '#999',
              border: '1px solid #444', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}