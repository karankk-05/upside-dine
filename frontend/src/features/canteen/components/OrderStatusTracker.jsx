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

  if (status === 'cancelled' || status === 'rejected') {
    return (
      <div className="canteen-order-timeline" style={{ padding: '20px' }}>
        <div className="canteen-timeline-item canteen-timeline-item--active">
          <div className="canteen-timeline-dot" style={{ background: '#ff3333', borderColor: '#ff3333' }}>
            ✕
          </div>
          <div className="canteen-timeline-content">
            <h3 className="canteen-timeline-title" style={{ color: '#ff3333' }}>
              {status === 'cancelled' ? 'Order Cancelled' : 'Order Rejected'}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const statusOrder = steps.map((step) => step.key);
  const currentIdx = statusOrder.indexOf(status);
  const isTerminalStatus = currentIdx === steps.length - 1;

  return (
    <div className="canteen-order-timeline" style={{ padding: '20px' }}>
      {steps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCompletedCurrent = idx === currentIdx && isTerminalStatus;
        const isCurrent = idx === currentIdx && !isTerminalStatus;
        const isActive = isDone || isCurrent || isCompletedCurrent;
        const statusLabel = isCurrent ? '● In Progress' : isDone || isCompletedCurrent ? 'Completed' : 'Pending';

        return (
          <div key={step.key} className={`canteen-timeline-item ${isActive ? 'canteen-timeline-item--active' : ''}`}>
            <div
              className="canteen-timeline-dot"
              style={
                isCurrent
                  ? {
                      boxShadow: '0 0 12px rgba(212, 85, 85, 0.6)',
                      animation: 'canteen-pulse 2s ease-in-out infinite',
                    }
                  : {}
              }
            >
              {isDone || isCompletedCurrent ? '✓' : step.icon}
            </div>
            <div className="canteen-timeline-content">
              <h3
                className="canteen-timeline-title"
                style={{
                  color: isDone ? '#aaa' : isCurrent || isCompletedCurrent ? '#fff' : '#555',
                  fontWeight: isCurrent || isCompletedCurrent ? 700 : 500,
                }}
              >
                {step.label}
              </h3>
              <p
                className="canteen-timeline-time"
                style={{
                  color: isCurrent ? '#d45555' : isDone || isCompletedCurrent ? '#666' : '#444',
                  fontSize: 11,
                }}
              >
                {statusLabel}
                {timestamps[step.key] &&
                  ` · ${new Date(timestamps[step.key]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
