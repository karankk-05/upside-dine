import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBookingDetail } from '../hooks/useBookingDetail';
import QRCodeDisplay from '../components/QRCodeDisplay';
import CancelBookingButton from '../components/CancelBookingButton';
import '../mess.css';

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading, isError } = useBookingDetail(id);

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate('/mess/bookings')}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="mess-page-title">Your QR Code</h1>
      </div>

      {isLoading ? (
        <div className="mess-loading">
          <div className="mess-loading-spinner" />
          <span className="mess-loading-text">Loading booking...</span>
        </div>
      ) : isError ? (
        <div className="mess-error">Failed to load booking details.</div>
      ) : booking ? (
        <div className="mess-qr-container">
          <QRCodeDisplay booking={booking} />
          {booking.status === 'pending' && (
            <div style={{ marginTop: 24 }}>
              <CancelBookingButton bookingId={booking.id} onCancelled={() => navigate('/mess/bookings')} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default BookingDetailPage;
