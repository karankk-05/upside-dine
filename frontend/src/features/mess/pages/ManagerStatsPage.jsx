import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useManagerStats } from '../hooks/useManagerStats';
import '../mess.css';

const COLORS = ['#d63434', '#00ff00', '#ffaa00', '#999999'];

const ManagerStatsPage = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError } = useManagerStats();

  const pieData = stats ? [
    { name: 'Redeemed', value: stats.total_redeemed || 0 },
    { name: 'Pending', value: stats.total_pending || 0 },
    { name: 'Expired', value: stats.total_expired || 0 },
    { name: 'Cancelled', value: stats.total_cancelled || 0 },
  ].filter((d) => d.value > 0) : [];

  const barData = stats ? [
    { name: 'Total', count: stats.total_bookings || 0 },
    { name: 'Redeemed', count: stats.total_redeemed || 0 },
    { name: 'Pending', count: stats.total_pending || 0 },
    { name: 'Expired', count: stats.total_expired || 0 },
    { name: 'Cancelled', count: stats.total_cancelled || 0 },
  ] : [];

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate('/manager/mess')}><ArrowLeft size={18} /></button>
        <h1 className="mess-page-title">Statistics</h1>
      </div>

      <div className="mess-content">
        {isLoading ? (
          <div className="mess-loading"><div className="mess-loading-spinner" /><span className="mess-loading-text">Loading stats...</span></div>
        ) : isError ? (
          <div className="mess-error">Statistics currently not available.</div>
        ) : stats ? (
          <>
            <div className="mess-stat-grid">
              <div className="mess-stat-card"><div className="mess-stat-value">{stats.total_bookings}</div><div className="mess-stat-label">Total Bookings</div></div>
              <div className="mess-stat-card"><div className="mess-stat-value" style={{ color: '#00ff00' }}>₹{parseFloat(stats.total_revenue || 0).toLocaleString('en-IN')}</div><div className="mess-stat-label">Revenue</div></div>
              <div className="mess-stat-card"><div className="mess-stat-value" style={{ color: '#00ff00' }}>{stats.total_redeemed}</div><div className="mess-stat-label">Redeemed</div></div>
              <div className="mess-stat-card">
                <div className="mess-stat-value" style={{ color: '#ffaa00' }}>
                  {stats.total_bookings > 0 ? Math.round((stats.total_redeemed / stats.total_bookings) * 100) : 0}%
                </div>
                <div className="mess-stat-label">Redemption Rate</div>
              </div>
            </div>

            {stats.most_popular_item && (
              <div className="mess-stat-card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <TrendingUp size={20} color="var(--st-accent)" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Most Popular</div>
                  <div style={{ fontSize: 13, color: 'var(--st-text-dim)' }}>{stats.most_popular_item.item_name} — {stats.most_popular_item.total_quantity} orders</div>
                </div>
              </div>
            )}

            {barData.length > 0 && (
              <div className="mess-chart-container">
                <div className="mess-chart-title">Booking Status Breakdown</div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#999', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="count" fill="#d63434" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {pieData.length > 0 && (
              <div className="mess-chart-container">
                <div className="mess-chart-title">Status Distribution</div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ManagerStatsPage;
