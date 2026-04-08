import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import InfiniteScrollSentinel from '../../../components/InfiniteScrollSentinel';
import { useIncrementalList } from '../../../hooks/useIncrementalList';
import { useMyBookings } from '../hooks/useMyBookings';
import '../mess.css';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const { data: bookings, isLoading, isError } = useMyBookings(statusFilter ? { status: statusFilter } : {});
  const filteredBookings = (bookings || []).filter((booking) => !statusFilter || booking.status === statusFilter);
  const {
    visibleItems: visibleBookings,
    hasMore,
    loadMore,
  } = useIncrementalList(filteredBookings, {
    initialCount: 8,
    step: 6,
    resetKey: statusFilter,
  });

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="mess-page-title">My Bookings</h1>
      </div>

      <div className="mess-content">
        <div className="mess-tabs">
          {STATUS_TABS.map((tab) => (
            <button key={tab.value} className={`mess-tab ${statusFilter === tab.value ? 'active' : ''}`} onClick={() => setStatusFilter(tab.value)}>
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mess-loading">
            <div className="mess-loading-spinner" />
            <span className="mess-loading-text">Loading bookings...</span>
          </div>
        ) : isError ? (
          <div className="mess-error">Bookings currently not available. Please try again.</div>
        ) : filteredBookings.length === 0 ? (
          <div className="mess-empty">
            <div className="mess-empty-icon">📋</div>
            <div>No bookings found</div>
          </div>
        ) : (
          <>
          {visibleBookings.map((booking) => (
            <div key={booking.id} className="mess-booking-card" onClick={() => navigate(`/mess/bookings/${booking.id}`)} id={`booking-card-${booking.id}`}>
              <div className="mess-booking-header">
                <span className="mess-booking-id">{booking.booking_reference || `#${booking.id}`}</span>
                <span className={`mess-status-badge ${booking.status}`}>{booking.status}</span>
              </div>
              <div className="mess-booking-details">{booking.menu_item?.item_name} · ₹{booking.total_price}</div>
              <div className="mess-booking-details">Qty: {booking.quantity} · {booking.meal_type}</div>
              <div className="mess-booking-details">
                {new Date(booking.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
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

export default MyBookingsPage;
