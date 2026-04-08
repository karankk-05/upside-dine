import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import InfiniteScrollSentinel from '../../../components/InfiniteScrollSentinel';
import { useIncrementalList } from '../../../hooks/useIncrementalList';
import { useScanHistory } from '../hooks/useScanHistory';
import '../mess.css';

const ScanHistoryPage = () => {
  const navigate = useNavigate();
  const { data: scans, isLoading, isError } = useScanHistory();
  const {
    visibleItems: visibleScans,
    hasMore,
    loadMore,
  } = useIncrementalList(scans || [], {
    initialCount: 8,
    step: 6,
    resetKey: (scans || []).length,
  });

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate('/worker/scan')}><ArrowLeft size={18} /></button>
        <h1 className="mess-page-title">Scan History</h1>
      </div>

      <div className="mess-content">
        <h3 className="mess-section-title" style={{ marginBottom: 16 }}>Recent Scans</h3>

        {isLoading ? (
          <div className="mess-loading"><div className="mess-loading-spinner" /><span className="mess-loading-text">Loading scan history...</span></div>
        ) : isError ? (
          <div className="mess-error">Scan history currently not available.</div>
        ) : (scans || []).length === 0 ? (
          <div className="mess-empty"><div className="mess-empty-icon">📷</div><div>No scans yet in this session</div></div>
        ) : (
          <>
          {visibleScans.map((scan) => (
            <div key={scan.id} className="mess-booking-card" style={{ cursor: 'default' }}>
              <div className="mess-booking-header">
                <span className="mess-booking-id">{scan.booking_reference || `#${scan.id}`}</span>
                <span className="mess-status-badge redeemed">✓ Valid</span>
              </div>
              <div className="mess-booking-details">{scan.menu_item?.item_name} · ₹{scan.total_price}</div>
              <div className="mess-booking-details">Qty: {scan.quantity} · {scan.meal_type}</div>
              <div className="mess-booking-details" style={{ color: '#00ff00' }}>
                Redeemed: {new Date(scan.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
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

export default ScanHistoryPage;
