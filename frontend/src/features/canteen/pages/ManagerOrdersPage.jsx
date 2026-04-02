import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useManagerOrders } from '../hooks/useManagerOrders';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import { formatDistanceToNow } from 'date-fns';
import '../canteen.css';

const badgeClass = (status) => {
  const map = { received: '--new', confirmed: '--new', preparing: '--preparing', ready: '--ready', out_for_delivery: '--delivered', delivered: '--delivered', cancelled: '--cancelled' };
  return `canteen-order-badge ${map[status] || '--new'}`;
};

export default function ManagerOrdersPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const { data: orders = [], isLoading, refetch } = useManagerOrders();
  const { mutateAsync: updateStatus } = useUpdateOrderStatus();

  const filtered = filter === 'all' ? orders : orders.filter(o => o.order_type === filter);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateStatus({ id, status: newStatus });
      refetch();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">Manage Orders</h1>
      </div>

      <div style={{ padding: 20, paddingBottom: 100 }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Active Orders</h3>
          <div className="canteen-filter-tabs">
            {['all', 'pickup', 'delivery'].map((f) => (
              <button key={f} className={`canteen-filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="canteen-loading"><div className="canteen-loading-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="canteen-empty"><div className="canteen-empty__icon">📦</div><p className="canteen-empty__text">No orders</p></div>
        ) : (
          filtered.map((order, idx) => (
            <motion.div
              key={order.id}
              className="canteen-order-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <div className="canteen-order-card__header">
                <span className="canteen-order-card__id">#{order.id}</span>
                <span className={badgeClass(order.status)}>{order.status?.replace(/_/g, ' ')}</span>
              </div>
              <p className="canteen-order-card__details">{order.items?.map(i => i.item_name || i.name).join(', ')}</p>
              <p className="canteen-order-card__details">Student: {order.student_name || order.user_email || 'N/A'}</p>
              <p className="canteen-order-card__details">Type: {order.order_type} • ₹{order.total_amount || order.total}</p>
              <p className="canteen-order-card__details" style={{ fontSize: 11, color: '#d45555' }}>
                <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {order.created_at ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true }) : ''}
              </p>
              <div className="canteen-order-card__actions">
                {order.status === 'received' && (
                  <>
                    <button className="canteen-btn-small canteen-btn-small--primary" onClick={() => handleStatusUpdate(order.id, 'preparing')}>Accept & Prepare</button>
                    <button className="canteen-btn-small canteen-btn-small--danger" onClick={() => handleStatusUpdate(order.id, 'cancelled')}>Reject</button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <button className="canteen-btn-small canteen-btn-small--primary" onClick={() => handleStatusUpdate(order.id, 'ready')}>Mark Ready</button>
                )}
                {order.status === 'ready' && order.order_type === 'delivery' && (
                  <button className="canteen-btn-small canteen-btn-small--primary" onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}>Assign Delivery</button>
                )}
                <button className="canteen-btn-small" onClick={() => navigate(`/manager/canteen/orders/${order.id}`)}>View Details</button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}