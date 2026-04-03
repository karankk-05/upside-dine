import '../canteen.css';

const PICKUP_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '📋' },
  { key: 'confirmed', label: 'Order Confirmed', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '🍳' },
  { key: 'ready', label: 'Ready for Pickup', icon: '📦' },
  { key: 'picked_up', label: 'Order Complete', icon: '🎉' },
];

const DELIVERY_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '📋' },
  { key: 'confirmed', label: 'Order Confirmed', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '🍳' },
  { key: 'ready', label: 'Ready', icon: '📦' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚴' },
  { key: 'delivered', label: 'Delivered', icon: '🎉' },
];

export default function OrderStatusTracker({ status, orderType = 'pickup', timestamps = {} }) {
  const steps = orderType === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;

  // Handle cancelled/rejected as special cases
  if (status === 'cancelled' || status === 'rejected') {
    return (
      <div className="canteen-order-timeline" style={{ padding: '20px' }}>
        <div className="canteen-timeline-item canteen-timeline-item--active">
          <div className="canteen-timeline-dot" style={{ background: '#ff3333', borderColor: '#ff3333' }}>✕</div>
          <div className="canteen-timeline-content">
            <h3 className="canteen-timeline-title" style={{ color: '#ff3333' }}>
              {status === 'cancelled' ? 'Order Cancelled' : 'Order Rejected'}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const statusOrder = steps.map((s) => s.key);
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="canteen-order-timeline" style={{ padding: '20px' }}>
      {steps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <div
            key={step.key}
            className={`canteen-timeline-item ${isDone || isCurrent ? 'canteen-timeline-item--active' : ''}`}
          >
            <div
              className="canteen-timeline-dot"
              style={isCurrent ? {
                boxShadow: '0 0 12px rgba(212, 85, 85, 0.6)',
                animation: 'canteen-pulse 2s ease-in-out infinite',
              } : {}}
            >
              {isDone ? '✓' : step.icon}
            </div>
            <div className="canteen-timeline-content">
              <h3 className="canteen-timeline-title" style={{
                color: isDone ? '#aaa' : isCurrent ? '#fff' : '#555',
                fontWeight: isCurrent ? 700 : 500,
              }}>
                {step.label}
              </h3>
              <p className="canteen-timeline-time" style={{
                color: isCurrent ? '#d45555' : isDone ? '#666' : '#444',
                fontSize: 11,
              }}>
                {isCurrent ? '● In Progress' : isDone ? 'Completed' : 'Pending'}
                {timestamps[step.key] && ` · ${new Date(timestamps[step.key]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}