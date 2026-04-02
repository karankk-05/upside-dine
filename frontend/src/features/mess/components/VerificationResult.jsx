import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const VerificationResult = ({ result, error, onDismiss }) => {
  if (error) {
    const data = error?.response?.data;
    let errorMsg = 'Verification failed. Please try again.';

    if (data?.detail) {
      errorMsg = data.detail;
    } else if (data?.qr_code) {
      errorMsg = Array.isArray(data.qr_code) ? data.qr_code[0] : data.qr_code;
    } else if (data?.booking_id) {
      errorMsg = Array.isArray(data.booking_id) ? data.booking_id[0] : data.booking_id;
    } else if (typeof data === 'object' && data !== null) {
      // Try to extract the first error from any field
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const val = data[firstKey];
        errorMsg = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
      }
    }

    // Friendly error messages
    const friendlyMessages = {
      'Booking is already redeemed.': '⚠️ This booking was already verified and redeemed.',
      'Booking is cancelled and cannot be redeemed.': '⚠️ This booking has been cancelled by the student.',
      'Booking is already expired.': '⏰ This booking\'s QR code has expired (3-hour window passed).',
      'QR code has expired.': '⏰ This QR code has expired. Ask the student to create a new booking.',
      'Invalid QR code.': '❌ This QR code is not recognized. It may be from a different system.',
      'Booking not found.': '❌ No booking found with this ID.',
    };

    const friendlyMsg = friendlyMessages[errorMsg] || errorMsg;
    const statusCode = error?.response?.status;

    return (
      <div className="mess-verify-result error">
        <div className="mess-verify-icon">
          {statusCode === 403 ? <AlertCircle size={48} color="#ffaa00" /> : <XCircle size={48} color="#ff3333" />}
        </div>
        <div className="mess-verify-title" style={{ color: statusCode === 403 ? '#ffaa00' : '#ff3333' }}>
          {statusCode === 403 ? 'Access Denied' : 'Cannot Verify'}
        </div>
        <div className="mess-verify-detail">{friendlyMsg}</div>
        {statusCode === 403 && (
          <div className="mess-verify-detail" style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
            Make sure you are logged in as a Mess Worker account.
          </div>
        )}
        <button className="mess-btn-outline" onClick={onDismiss} style={{ marginTop: 16 }}>Try Again</button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mess-verify-result success">
      <div className="mess-verify-icon"><CheckCircle size={48} color="#00ff00" /></div>
      <div className="mess-verify-title" style={{ color: '#00ff00' }}>Verified ✓</div>
      <div className="mess-verify-detail"><strong>Item:</strong> {result.menu_item?.item_name}</div>
      <div className="mess-verify-detail"><strong>Booking:</strong> {result.booking_reference || `#${result.id}`}</div>
      <div className="mess-verify-detail"><strong>Quantity:</strong> {result.quantity}</div>
      <div className="mess-verify-detail"><strong>Amount:</strong> ₹{result.total_price}</div>
      <div className="mess-verify-detail"><strong>Meal:</strong> {result.meal_type}</div>
      <div className="mess-verify-detail"><strong>Status:</strong> {result.status}</div>
      <button className="mess-btn-outline" onClick={onDismiss} style={{ marginTop: 16 }}>Scan Next</button>
    </div>
  );
};

export default VerificationResult;
