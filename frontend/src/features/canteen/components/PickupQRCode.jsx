import '../canteen.css';

export default function PickupQRCode({ orderId, qrData }) {
  return (
    <div className="canteen-qr-card">
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Pickup QR Code</h3>
      <div className="canteen-qr-code">
        {qrData ? (
          <img src={qrData} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: 14, color: '#666' }}>QR: {orderId}</span>
        )}
      </div>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
        Show this QR code at the canteen counter
      </p>
      <p style={{ fontSize: 12, color: '#d45555', fontWeight: 600 }}>
        Order #{orderId}
      </p>
    </div>
  );
}