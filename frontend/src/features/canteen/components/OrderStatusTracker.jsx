import '../canteen.css';

const STEPS = [
  { key: 'placed', label: 'Order Placed', icon: '✓' },
  { key: 'confirmed', label: 'Confirmed', icon: '✓' },
  { key: 'preparing', label: 'Preparing', icon: '🍳' },
  { key: 'ready', label: 'Ready for Pickup', icon: '📦' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚴' },
  { key: 'delivered', label: 'Delivered', icon: '✓' },
  { key: 'completed', label: 'Completed', icon: '✓' },
];

export default function OrderStatusTracker({ status, orderType = 'pickup' }) {
  // Filter out delivery steps for pickup orders
  const steps = STEPS.filter((s) => {
    if (orderType !== 'delivery' && s.key === 'out_for_delivery') return false;
    if (orderType === 'delivery' && s.key === 'completed') return false;
    return true;
  });

  const statusOrder = steps.map((s) => s.key);
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="canteen-order-timeline">
      {steps.map((step, idx) => {
        const isActive = idx <= currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div
            key={step.key}
            className={`canteen-timeline-item ${isActive ? 'canteen-timeline-item--active' : ''}`}
          >
            <div className="canteen-timeline-dot" style={isCurrent ? { animation: 'canteen-spin 2s linear infinite' } : {}}>
              {step.icon}
            </div>
            <div className="canteen-timeline-content">
              <h3 className="canteen-timeline-title" style={{ color: isActive ? '#fff' : '#666' }}>
                {step.label}
              </h3>
              <p className="canteen-timeline-time">
                {isCurrent ? 'In Progress' : isActive ? 'Completed' : 'Pending'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}