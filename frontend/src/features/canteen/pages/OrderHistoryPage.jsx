import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { formatDistanceToNow } from 'date-fns';
import '../canteen.css';

const badgeClass = (status) => {
  const map = { received: '--new', confirmed: '--new', preparing: '--preparing', ready: '--ready', out_for_delivery: '--delivered', delivered: '--delivered', completed: '--ready', cancelled: '--cancelled' };
  return `canteen-order-badge ${map[status] || '--new'}`;
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrderHistory();

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">My Orders</h1>
      </div>

      <div style={{ padding: 20, paddingBottom: 100 }}>
        {isLoading ? (
          <div className="canteen-loading"><div className="canteen-loading-spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="canteen-empty"><div className="canteen-empty__icon">📦</div><p className="canteen-empty__text">No orders yet</p></div>
        ) : (
          orders.map((order, idx) => (
            <motion.div
              key={order.id}
              className="canteen-order-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              onClick={() => navigate(`/orders/${order.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="canteen-order-card__header">
                <span className="canteen-order-card__id">#{order.id}</span>
                <span className={badgeClass(order.status)}>{order.status?.replace(/_/g, ' ')}</span>
              </div>
              <p className="canteen-order-card__details">
                {order.items?.map(i => i.item_name || i.name).join(', ') || 'Order items'}
              </p>
              <p className="canteen-order-card__details" style={{ color: '#d45555', fontWeight: 600 }}>
                ₹{order.total_amount || order.total}
              </p>
              <p className="canteen-order-card__details" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} /> {order.created_at ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true }) : ''}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}