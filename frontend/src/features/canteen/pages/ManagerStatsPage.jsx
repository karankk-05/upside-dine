import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Package, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useManagerStats } from '../hooks/useManagerStats';
import '../canteen.css';

export default function ManagerStatsPage() {
  const navigate = useNavigate();
  const { data: statsArr = [], isLoading } = useManagerStats();

  // Aggregate across all canteens
  const totals = statsArr.reduce(
    (acc, s) => ({
      totalOrders: acc.totalOrders + (s.total_orders || 0),
      totalRevenue: acc.totalRevenue + parseFloat(s.total_revenue || 0),
      pendingOrders: acc.pendingOrders + (s.pending_orders || 0),
      preparingOrders: acc.preparingOrders + (s.preparing_orders || 0),
      readyOrders: acc.readyOrders + (s.ready_orders || 0),
      completedOrders: acc.completedOrders + (s.completed_orders || 0),
    }),
    { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, preparingOrders: 0, readyOrders: 0, completedOrders: 0 }
  );

  const statCards = [
    { label: "Today's Revenue", value: `₹${totals.totalRevenue.toFixed(0)}`, color: '#00ff66', icon: '💰', bg: '#003311' },
    { label: 'Total Orders', value: totals.totalOrders, color: '#d45555', icon: '📊', bg: '#331111' },
    { label: 'Completed', value: totals.completedOrders, color: '#66aaff', icon: '✅', bg: '#112233' },
    { label: 'Pending', value: totals.pendingOrders, color: '#ff6b6b', icon: '🔔', bg: '#331111' },
    { label: 'Preparing', value: totals.preparingOrders, color: '#ffaa33', icon: '🍳', bg: '#332200' },
    { label: 'Ready', value: totals.readyOrders, color: '#00ff66', icon: '📦', bg: '#003311' },
  ];

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">Statistics</h1>
      </div>

      <div style={{ padding: 20, paddingBottom: 100 }}>
        {isLoading ? (
          <div className="canteen-loading"><div className="canteen-loading-spinner" /></div>
        ) : (
          <>
            {/* Revenue Hero */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'linear-gradient(135deg, #0a1a0a 0%, #112211 50%, #0a1a0a 100%)',
                border: '2px solid #00ff66',
                borderRadius: 20,
                padding: 28,
                textAlign: 'center',
                marginBottom: 24,
                boxShadow: '0 0 40px rgba(0,255,102,0.08)',
              }}
            >
              <p style={{ fontSize: 13, color: '#66cc66', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                💰 Today's Total Revenue
              </p>
              <h2 style={{ fontSize: 42, fontWeight: 800, color: '#00ff66', fontFamily: 'monospace', letterSpacing: 2 }}>
                ₹{totals.totalRevenue.toFixed(2)}
              </h2>
              <p style={{ fontSize: 12, color: '#669966', marginTop: 8 }}>
                From {totals.completedOrders} completed order{totals.completedOrders !== 1 ? 's' : ''}
              </p>
            </motion.div>

            {/* Stat Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
              {statCards.slice(1).map((card, idx) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.06 }}
                  style={{
                    background: card.bg,
                    border: `1px solid ${card.color}33`,
                    borderRadius: 14,
                    padding: 14,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{card.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{card.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Per-Canteen Breakdown */}
            {statsArr.length > 1 && (
              <div style={{ marginTop: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Per Canteen</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {statsArr.map((s, idx) => (
                    <motion.div
                      key={s.canteen_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      style={{
                        background: '#1a1a1a', border: '1px solid #333', borderRadius: 14,
                        padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#eee', marginBottom: 4 }}>{s.canteen_name}</p>
                        <p style={{ fontSize: 12, color: '#888' }}>
                          {s.total_orders} orders • {s.completed_orders} completed
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 18, fontWeight: 700, color: '#00ff66' }}>₹{parseFloat(s.total_revenue || 0).toFixed(0)}</p>
                        {s.pending_orders > 0 && (
                          <p style={{ fontSize: 11, color: '#ff6b6b' }}>{s.pending_orders} pending</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}