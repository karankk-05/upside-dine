import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useOrderDetail } from '../hooks/useOrderDetail';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import OrderStatusTracker from '../components/OrderStatusTracker';
import '../canteen.css';

export default function ManagerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, refetch } = useOrderDetail(id);
  const { mutateAsync: updateStatus } = useUpdateOrderStatus();

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateStatus({ id, status: newStatus });
      refetch();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update');
    }
  };

  if (isLoading) return <div className="canteen-page"><div className="canteen-loading"><div className="canteen-loading-spinner" /></div></div>;
  if (!order) return <div className="canteen-page"><div className="canteen-empty"><p className="canteen-empty__text">Order not found</p></div></div>;

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">Order #{order.id}</h1>
      </div>

      {/* Order Details */}
      <div style={{ padding: 20 }}>
        <div className="canteen-order-card" style={{ border: '2px solid #d45555', boxShadow: '0 0 15px rgba(232,85,85,0.12)' }}>
          <div className="canteen-order-card__header">
            <span className="canteen-order-card__id">#{order.id}</span>
            <span className={`canteen-order-badge canteen-order-badge--${order.status === 'preparing' ? 'preparing' : order.status === 'ready' ? 'ready' : 'new'}`}>
              {order.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{ background: '#111', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Items:</p>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{item.item_name || item.name} × {item.quantity}</span>
                <span style={{ color: '#d45555' }}>₹{(item.price || item.unit_price) * item.quantity}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: '#d45555' }}>₹{order.total_amount || order.total}</span>
            </div>
          </div>

          <p className="canteen-order-card__details">Student: {order.student_name || order.user_email || 'N/A'}</p>
          <p className="canteen-order-card__details">Type: {order.order_type || 'pickup'}</p>
          {order.delivery_address && <p className="canteen-order-card__details">Address: {order.delivery_address}</p>}
          {order.notes && <p className="canteen-order-card__details">Notes: {order.notes}</p>}

          <div className="canteen-order-card__actions" style={{ marginTop: 16 }}>
            {order.status === 'received' && (
              <>
                <button className="canteen-btn-small canteen-btn-small--primary" onClick={() => handleStatusUpdate('preparing')}>Accept & Prepare</button>
                <button className="canteen-btn-small canteen-btn-small--danger" onClick={() => handleStatusUpdate('cancelled')}>Reject</button>
              </>
            )}
            {order.status === 'preparing' && (
              <button className="canteen-btn-small canteen-btn-small--primary" onClick={() => handleStatusUpdate('ready')}>Mark Ready</button>
            )}
            {order.status === 'ready' && order.order_type === 'delivery' && (
              <button className="canteen-btn-small canteen-btn-small--primary" onClick={() => handleStatusUpdate('out_for_delivery')}>Assign Delivery</button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <OrderStatusTracker status={order.status} orderType={order.order_type} />
    </div>
  );
}