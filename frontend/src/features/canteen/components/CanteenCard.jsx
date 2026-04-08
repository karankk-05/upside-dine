import { motion } from 'framer-motion';

export default function CanteenCard({ canteen, index = 0, onClick, ...props }) {
  const getTimeInfo = () => {
    if (!canteen.opening_time || !canteen.closing_time) {
      return { isOpen: true, text: '' };
    }
    const now = new Date();
    const [openH, openM] = canteen.opening_time.split(':').map(Number);
    const [closeH, closeM] = canteen.closing_time.split(':').map(Number);
    const open = new Date(); open.setHours(openH, openM, 0, 0);
    const close = new Date(); close.setHours(closeH, closeM, 0, 0);
    const isOpen = close > open ? (now >= open && now <= close) : (now >= open || now <= close);

    let text = '';
    if (isOpen) {
      const diffMs = (close > now ? close : new Date(close.getTime() + 86400000)) - now;
      const diffMin = Math.max(0, Math.floor(diffMs / 60000));
      text = diffMin <= 60 ? `Closes in ${diffMin} min` : `Closes at ${canteen.closing_time.slice(0, 5)}`;
    } else {
      text = `Opens at ${canteen.opening_time.slice(0, 5)}`;
    }
    return { isOpen, text };
  };

  const { isOpen, text } = getTimeInfo();
  const emojis = ['🍕', '🍔', '🥡', '☕', '🍜', '🧁', '🥪', '🍩'];
  const emoji = emojis[index % emojis.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      onClick={onClick}
      {...props}
      style={{
        background: '#1a1a1a', border: '1px solid #333', borderRadius: 16,
        padding: 16, display: 'flex', gap: 12, cursor: 'pointer',
        transition: 'all 0.3s ease', opacity: isOpen ? 1 : 0.6,
      }}
    >
      <div style={{
        width: 64, height: 64, background: '#2a2a2a', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, flexShrink: 0,
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{canteen.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            background: isOpen ? '#112211' : '#331111',
            color: isOpen ? '#33aa33' : '#ff6b6b',
            border: `1px solid ${isOpen ? '#33aa33' : '#ff6b6b'}`,
            textTransform: 'uppercase',
          }}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <span style={{ fontSize: 12, color: '#999' }}>{text}</span>
        </div>
        <div style={{ fontSize: 12, color: '#999', display: 'flex', gap: 8 }}>
          {canteen.is_delivery_available && <span>🚴 ₹{canteen.delivery_fee} delivery</span>}
          {canteen.min_order_amount && <span>• Min ₹{canteen.min_order_amount}</span>}
        </div>
      </div>
    </motion.div>
  );
}
