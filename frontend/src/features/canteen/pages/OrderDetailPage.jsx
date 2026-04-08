import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useOrderDetail } from '../hooks/useOrderDetail';
import { useCancelOrder } from '../hooks/useCancelOrder';
import OrderStatusTracker from '../components/OrderStatusTracker';
import '../canteen.css';

const badgeVariantForStatus = (status) => {
  if (status === 'preparing') return 'preparing';
  if (status === 'ready' || status === 'completed') return 'ready';
  if (['out_for_delivery', 'delivered', 'picked_up'].includes(status)) return 'delivered';
  if (['cancelled', 'rejected'].includes(status)) return 'cancelled';
  return 'new';
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrderDetail(id);
  const { mutateAsync: cancelOrder } = useCancelOrder();

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await cancelOrder(id);
      navigate('/orders');
    } catch (err) {
      alert(err.response?.data?.detail || 'Cannot cancel this order');
    }
  };

  if (isLoading) return <div className="canteen-page"><div className="canteen-loading"><div className="canteen-loading-spinner" /></div></div>;
  if (!order) return <div className="canteen-page"><div className="canteen-empty"><p className="canteen-empty__text">Order not found</p></div></div>;

  const showOtp = order.pickup_otp && !['picked_up', 'delivered', 'cancelled', 'rejected'].includes(order.status);

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">Order Status</h1>
      </div>

      {/* Order Info */}
      <div style={{ padding: 20, background: '#000', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Order #{order.order_number || order.id}</h2>
            <p style={{ fontSize: 12, color: '#999' }}>{(order.order_type || 'pickup').replace(/_/g, ' ')}</p>
          </div>
          <span className={`canteen-order-badge canteen-order-badge--${badgeVariantForStatus(order.status)}`}>
            {order.status?.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 12, marginTop: 12 }}>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>{item.menu_item_name || item.item_name || item.name} × {item.quantity}</span>
              <span style={{ color: '#d45555' }}>₹{item.total_price || (item.unit_price || item.price) * item.quantity}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: '#d45555' }}>₹{order.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Delivery Coordinator Info */}
      {order.order_type === 'delivery' && order.delivery_person_name && (
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{
            background: '#1a1a1a', border: '1px solid #b566ff', borderRadius: 14,
            padding: 16, display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 0 15px rgba(181,102,255,0.08)',
          }}>
            <div style={{
              width: 44, height: 44, background: '#220044', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>🚴</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>
                {order.status === 'out_for_delivery' ? 'Your delivery coordinator' : 'Delivered by'}
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#eee' }}>{order.delivery_person_name}</p>
              {order.delivery_person_phone && (
                <p style={{ fontSize: 12, color: '#b566ff', marginTop: 2 }}>📞 {order.delivery_person_phone}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <OrderStatusTracker status={order.status} orderType={order.order_type} />

      {/* OTP Section */}
      {showOtp && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)',
            border: '2px solid #d45555',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(212, 85, 85, 0.1)',
          }}>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
              {order.order_type === 'delivery' ? '🚴 Delivery Verification Code' : '📦 Pickup Verification Code'}
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 12,
            }}>
              {order.pickup_otp.split('').map((digit, i) => (
                <div key={i} style={{
                  width: 44, height: 52,
                  background: '#000',
                  border: '2px solid #d45555',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#d45555',
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                }}>
                  {digit}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#666' }}>
              {order.order_type === 'delivery'
                ? 'Share this code with the delivery person to confirm delivery'
                : 'Share this code at the canteen counter to collect your order'}
            </p>
          </div>
        </div>
      )}


      {/* Spacer for bottom nav */}
      <div style={{ height: 100 }} />
    </div>
  );
}
