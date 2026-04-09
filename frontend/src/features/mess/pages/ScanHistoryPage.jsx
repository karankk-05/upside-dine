import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import InfiniteScrollSentinel from '../../../components/InfiniteScrollSentinel';
import { useIncrementalList } from '../../../hooks/useIncrementalList';
import { useScanHistory } from '../hooks/useScanHistory';
import '../mess.css';

const formatAttemptTime = (value) => {
  if (!value) {
    return 'Time unavailable';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Time unavailable';
  }

  return parsedDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getFallbackScanLabel = (scan) => {
  if (scan.attempted_booking_id) {
    return `Booking #${scan.attempted_booking_id}`;
  }

  if (scan.identifier_type === 'qr_code') {
    return 'QR scan attempt';
  }

  return 'Scan attempt';
};

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
        <button className="mess-back-btn" onClick={() => navigate('/worker/scan')}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="mess-page-title">Scan History</h1>
      </div>

      <div className="mess-content">
        <h3 className="mess-section-title" style={{ marginBottom: 16 }}>Recent Scans</h3>

        {isLoading ? (
          <div className="mess-loading">
            <div className="mess-loading-spinner" />
            <span className="mess-loading-text">Loading scan history...</span>
          </div>
        ) : isError ? (
          <div className="mess-error">Scan history currently not available.</div>
        ) : (scans || []).length === 0 ? (
          <div className="mess-empty">
            <div className="mess-empty-icon">QR</div>
            <div>No scans yet in this session</div>
          </div>
        ) : (
          <>
            {visibleScans.map((scan) => {
              const isFailed = scan.scan_status === 'failed';
              const statusBadgeClass = isFailed ? 'cancelled' : 'redeemed';
              const statusText = isFailed ? 'Failed' : 'Valid';
              const bookingLabel = scan.booking_reference || getFallbackScanLabel(scan);
              const itemLabel = scan.menu_item?.item_name || getFallbackScanLabel(scan);
              const quantityAndMeal = [
                scan.quantity ? `Qty: ${scan.quantity}` : null,
                scan.meal_type,
              ]
                .filter(Boolean)
                .join(' · ');
              const amountLabel = scan.total_price != null ? ` · Rs${scan.total_price}` : '';
              const timeLabel = `${isFailed ? 'Failed' : 'Verified'}: ${formatAttemptTime(
                scan.attempted_at || scan.created_at
              )}`;

              return (
                <div
                  key={scan.entry_id || scan.id}
                  className="mess-booking-card"
                  style={{ cursor: 'default' }}
                >
                  <div className="mess-booking-header">
                    <span className="mess-booking-id">{bookingLabel}</span>
                    <span className={`mess-status-badge ${statusBadgeClass}`}>{statusText}</span>
                  </div>

                  <div className="mess-booking-details">
                    {itemLabel}
                    {amountLabel}
                  </div>

                  {quantityAndMeal ? (
                    <div className="mess-booking-details">{quantityAndMeal}</div>
                  ) : null}

                  {isFailed ? (
                    <div className="mess-booking-details" style={{ color: '#ff8f8f' }}>
                      {scan.failure_reason || 'Verification failed.'}
                    </div>
                  ) : null}

                  <div
                    className="mess-booking-details"
                    style={{ color: isFailed ? '#ff6666' : '#00ff00' }}
                  >
                    {timeLabel}
                  </div>
                </div>
              );
            })}
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
