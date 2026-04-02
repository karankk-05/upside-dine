import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useManagerStats } from '../hooks/useManagerStats';
import '../canteen.css';

export default function ManagerStatsPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useManagerStats();

  const statCards = [
    { label: 'Total Orders', value: stats?.total_orders || 0 },
    { label: 'Revenue', value: `₹${stats?.revenue || 0}` },
    { label: 'Active Orders', value: stats?.active_orders || 0 },
    { label: 'Avg Rating', value: stats?.avg_rating || '—' },
    { label: 'Pickup Orders', value: stats?.pickup_orders || 0 },
    { label: 'Delivery Orders', value: stats?.delivery_orders || 0 },
  ];

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">Statistics</h1>
      </div>

      <div style={{ padding: 20, paddingBottom: 100 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Today's Overview</h3>

        {isLoading ? (
          <div className="canteen-loading"><div className="canteen-loading-spinner" /></div>
        ) : (
          <div className="canteen-stat-grid">
            {statCards.map((card, idx) => (
              <motion.div
                key={card.label}
                className="canteen-stat-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.08 }}
              >
                <div className="canteen-stat-card__value">{card.value}</div>
                <div className="canteen-stat-card__label">{card.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Popular Items */}
        {stats?.popular_items?.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Popular Items</h3>
            {stats.popular_items.map((item, idx) => (
              <div key={idx} className="canteen-menu-item" style={{ marginBottom: 8 }}>
                <div className="canteen-menu-item__info">
                  <span className="canteen-menu-item__name">{item.name}</span>
                  <p className="canteen-menu-item__desc">{item.orders_count} orders</p>
                </div>
                <span className="canteen-menu-item__price">₹{item.revenue}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}