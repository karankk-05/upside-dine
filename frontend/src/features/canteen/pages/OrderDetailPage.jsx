import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useOrderDetail } from '../hooks/useOrderDetail';
import { useCancelOrder } from '../hooks/useCancelOrder';
import OrderStatusTracker from '../components/OrderStatusTracker';
import PickupQRCode from '../components/PickupQRCode';
import '../canteen.css';

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
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Order #{order.id}</h2>
            <p style={{ fontSize: 12, color: '#999' }}>{order.order_type || 'Pickup'}</p>
          </div>
          <span className={`canteen-order-badge canteen-order-badge--${order.status === 'preparing' ? 'preparing' : order.status === 'ready' ? 'ready' : 'new'}`}>
            {order.status?.replace(/_/g, ' ')}
          </span>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 12, marginTop: 12 }}>
          <p style={{ fontSize: 13, marginBottom: 4 }}>
            <strong>Items:</strong> {order.items?.map(i => i.item_name || i.name).join(', ')}
          </p>
          <p style={{ fontSize: 13, color: '#999' }}>
            <strong>Total:</strong> <span style={{ color: '#d45555', fontWeight: 700 }}>₹{order.total_amount || order.total}</span>
          </p>
        </div>
      </div>

      {/* Timeline */}
      <OrderStatusTracker status={order.status} orderType={order.order_type} />

      {/* QR Code for pickup */}
      {order.order_type === 'pickup' && (order.status === 'ready' || order.status === 'confirmed') && (
        <div style={{ padding: '0 20px 20px' }}>
          <PickupQRCode orderId={order.id} qrData={order.qr_code} />
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '0 20px 100px', display: 'flex', gap: 12 }}>
        <button className="canteen-btn-small canteen-btn-small--primary" style={{ flex: 1, padding: 14 }}>
          Contact Canteen
        </button>
        {['received', 'confirmed'].includes(order.status) && (
          <button className="canteen-btn-small canteen-btn-small--danger" onClick={handleCancel} style={{ flex: 1, padding: 14 }}>
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}