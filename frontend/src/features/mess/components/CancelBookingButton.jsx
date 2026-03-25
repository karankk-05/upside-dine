import { useState } from 'react';
import { useCancelBooking } from '../hooks/useCancelBooking';

const CancelBookingButton = ({ bookingId, onCancelled }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const cancelMutation = useCancelBooking();

  const handleCancel = async () => {
    try {
      const result = await cancelMutation.mutateAsync(bookingId);
      setShowConfirm(false);
      if (onCancelled) onCancelled(result);
    } catch {
      // handled by mutation state
    }
  };

  if (showConfirm) {
    return (
      <div className="mess-confirm-overlay" onClick={() => setShowConfirm(false)}>
        <div className="mess-confirm-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="mess-confirm-title">Cancel Booking?</div>
          <div className="mess-confirm-message">
            This action cannot be undone. The amount will be refunded to your mess account.
          </div>

          {cancelMutation.isError && (
            <div style={{ background: 'rgba(255,51,51,0.1)', border: '1px solid #ff3333', borderRadius: 8, padding: 10, marginBottom: 16, color: '#ff3333', fontSize: 13 }}>
              {cancelMutation.error?.response?.data?.detail || 'Failed to cancel booking.'}
            </div>
          )}

          <div className="mess-confirm-actions">
            <button className="mess-btn-outline" onClick={() => setShowConfirm(false)} disabled={cancelMutation.isPending}>Keep it</button>
            <button className="mess-btn-danger" onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button className="mess-btn-danger" onClick={() => setShowConfirm(true)} style={{ width: '100%' }}>
      Cancel Booking
    </button>
  );
};

export default CancelBookingButton;
