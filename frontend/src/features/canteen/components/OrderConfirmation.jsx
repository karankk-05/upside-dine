import { motion } from 'framer-motion';
import '../canteen.css';

export default function OrderConfirmation({ order, onClose }) {
  if (!order) return null;

  const isPayLaterOrder = order.checkout_payment_method === 'cash';

  return (
    <div className="canteen-confirmation">
      <motion.div
        className="canteen-confirmation__card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="canteen-confirmation__icon">✅</div>
        <h2 className="canteen-confirmation__title">Order Placed!</h2>
        <p className="canteen-confirmation__subtitle">
          Order #{order.id} has been placed successfully.<br />
          Estimated ready time: {order.estimated_ready_time || '15-20 mins'}
        </p>

        {isPayLaterOrder ? (
          <div
            style={{
              background: '#20170d',
              border: '1px solid #8b6b33',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: '#f0d28a',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Pay Later selected. Please pay at the canteen counter
            {order.order_type === 'delivery' ? ' or on delivery' : ''}.
          </div>
        ) : null}

        <div style={{
          background: '#1a1a1a', border: '1px solid #333', borderRadius: 12,
          padding: 16, marginBottom: 20, textAlign: 'left',
        }}>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>{item.menu_item_name || item.name || item.item_name} × {item.quantity}</span>
              <span style={{ color: '#d45555' }}>₹{item.total_price || (item.price || item.unit_price) * item.quantity}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: '#d45555' }}>₹{order.total_amount || order.total}</span>
          </div>
        </div>

        <button className="canteen-btn-small canteen-btn-small--primary" onClick={onClose} style={{ width: '100%', padding: '14px' }}>
          Track Order
        </button>
      </motion.div>
    </div>
  );
}
