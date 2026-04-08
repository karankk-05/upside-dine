import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import InfiniteScrollSentinel from '../../../components/InfiniteScrollSentinel';
import { useIncrementalList } from '../../../hooks/useIncrementalList';
import { useManagerBookings } from '../hooks/useManagerBookings';
import '../mess.css';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ManagerBookingsPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const filters = {};
  if (statusFilter) filters.status = statusFilter;

  const { data, isLoading, isError } = useManagerBookings(filters);
  const stats = data?.stats || {};
  const bookings = data?.results || [];
  const {
    visibleItems: visibleBookings,
    hasMore,
    loadMore,
  } = useIncrementalList(bookings, {
    initialCount: 8,
    step: 6,
    resetKey: statusFilter,
  });

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate('/manager/mess')}><ArrowLeft size={18} /></button>
        <h1 className="mess-page-title">Today's Bookings</h1>
      </div>

      <div className="mess-content">
        {!isLoading && !isError && (
          <div className="mess-stat-grid">
            <div className="mess-stat-card"><div className="mess-stat-value">{stats.total || 0}</div><div className="mess-stat-label">Total</div></div>
            <div className="mess-stat-card"><div className="mess-stat-value" style={{ color: '#ffaa00' }}>{stats.pending || 0}</div><div className="mess-stat-label">Pending</div></div>
            <div className="mess-stat-card"><div className="mess-stat-value" style={{ color: '#00ff00' }}>{stats.redeemed || 0}</div><div className="mess-stat-label">Redeemed</div></div>
            <div className="mess-stat-card"><div className="mess-stat-value" style={{ color: '#ff3333' }}>{stats.expired || 0}</div><div className="mess-stat-label">Expired</div></div>
          </div>
        )}

        <div className="mess-tabs">
          {STATUS_TABS.map((tab) => (
            <button key={tab.value} className={`mess-tab ${statusFilter === tab.value ? 'active' : ''}`} onClick={() => setStatusFilter(tab.value)}>{tab.label}</button>
          ))}
        </div>

        <h3 className="mess-section-title" style={{ marginBottom: 16 }}>Recent Bookings</h3>

        {isLoading ? (
          <div className="mess-loading"><div className="mess-loading-spinner" /><span className="mess-loading-text">Loading bookings...</span></div>
        ) : isError ? (
          <div className="mess-error">Bookings currently not available.</div>
        ) : bookings.length === 0 ? (
          <div className="mess-empty"><div className="mess-empty-icon">📋</div><div>No bookings found</div></div>
        ) : (
          <>
          {visibleBookings.map((booking) => (
            <div key={booking.id} className="mess-booking-card" style={{ cursor: 'default' }}>
              <div className="mess-booking-header">
                <span className="mess-booking-id">#{booking.id}</span>
                <span className={`mess-status-badge ${booking.status}`}>{booking.status}</span>
              </div>
              <div className="mess-booking-details">{booking.menu_item?.item_name} · ₹{booking.total_price}</div>
              <div className="mess-booking-details">Qty: {booking.quantity} · {booking.meal_type}</div>
              <div className="mess-booking-details">
                {new Date(booking.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>
          ))
          }
          <InfiniteScrollSentinel
            hasMore={hasMore}
            onLoadMore={loadMore}
            skeletonCount={2}
            minHeight={112}
          />
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerBookingsPage;
