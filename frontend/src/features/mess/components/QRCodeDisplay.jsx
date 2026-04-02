import { useState, useEffect } from 'react';

const QRCodeDisplay = ({ booking }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [timerState, setTimerState] = useState('valid');

  useEffect(() => {
    if (!booking?.qr_expires_at || booking.status !== 'pending') return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(booking.qr_expires_at);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setTimerState('expired');
        return;
      }

      setTimerState(diff < 15 * 60 * 1000 ? 'expiring-soon' : 'valid');

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking?.qr_expires_at, booking?.status]);

  if (!booking) return null;

  const accessToken = localStorage.getItem('access_token') || '';
  const qrImageUrl = `/api/mess/bookings/${booking.id}/qr-image/?token=${accessToken}`;

  const statusLabels = {
    pending: 'Booking Confirmed!',
    redeemed: 'Redeemed',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };

  return (
    <div className="mess-qr-card">
      <h2 className="mess-qr-title">{statusLabels[booking.status] || booking.status}</h2>
      <p className="mess-qr-subtitle">
        {booking.status === 'pending' ? 'Show this QR code to the mess worker' : `This booking has been ${booking.status}`}
      </p>

      {booking.status === 'pending' && (
        <div className="mess-qr-image">
          <img src={qrImageUrl} alt="Booking QR Code" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      )}

      <div className="mess-qr-info">
        <div className="mess-qr-item-name">{booking.menu_item?.item_name}</div>
        <div className="mess-qr-booking-id">Booking Ref: {booking.booking_reference || booking.id}</div>
      </div>

      {booking.status === 'pending' && (
        <>
          <div className="mess-qr-validity">Valid for</div>
          <div className={`mess-qr-timer ${timerState}`}>{timeLeft}</div>
        </>
      )}

      <div className="mess-qr-details">
        <strong>Amount:</strong> ₹{booking.total_price}<br />
        <strong>Quantity:</strong> {booking.quantity}<br />
        <strong>Meal:</strong> {booking.meal_type}<br />
        {booking.status === 'pending' && booking.qr_expires_at && (
          <><strong>Expires:</strong> {new Date(booking.qr_expires_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' })}</>
        )}
        {booking.status === 'redeemed' && booking.redeemed_at && (
          <><strong>Redeemed at:</strong> {new Date(booking.redeemed_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' })}</>
        )}
      </div>
    </div>
  );
};

export default QRCodeDisplay;
