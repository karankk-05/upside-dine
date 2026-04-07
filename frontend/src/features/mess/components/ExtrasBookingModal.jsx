import { useState } from 'react';
import { X } from 'lucide-react';
import { useBookExtras } from '../hooks/useBookExtras';

const ExtrasBookingModal = ({ item, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const bookMutation = useBookExtras();

  const totalPrice = (parseFloat(item.price) * quantity).toFixed(2);
  const maxQty = Math.min(item.available_quantity, 10);

  const handleBook = async () => {
    try {
      const result = await bookMutation.mutateAsync({
        menu_item: item.id,
        quantity,
        meal_type: item.meal_type,
        mess_id: item.mess,
      });
      if (onSuccess) onSuccess(result);
    } catch {
      // Error handled by mutation state
    }
  };

  const getErrorMessage = (error) => {
    if (error?.response?.data?.detail) return error.response.data.detail;
    if (error?.response?.data) {
      const firstKey = Object.keys(error.response.data)[0];
      const val = error.response.data[firstKey];
      return Array.isArray(val) ? val[0] : val;
    }
    return 'Unable to book. Please try again.';
  };

  return (
    <div className="mess-modal-overlay" onClick={onClose}>
      <div className="mess-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="mess-modal-title" style={{ marginBottom: 0 }}>Book Extra</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--st-text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="mess-menu-item-name" style={{ marginBottom: 4 }}>{item.item_name}</div>
          {item.description && <div className="mess-menu-item-desc">{item.description}</div>}
          <div className="mess-menu-item-price" style={{ marginTop: 8 }}>₹{item.price} per item</div>
        </div>

        <div className="mess-input-group">
          <label className="mess-input-label">Quantity</label>
          <div className="mess-qty-stepper">
            <button className="mess-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
            <span className="mess-qty-value">{quantity}</span>
            <button className="mess-qty-btn" onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} disabled={quantity >= maxQty}>+</button>
          </div>
        </div>

        <div style={{ background: 'var(--st-light-gray)', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--st-text-dim)', fontSize: 14 }}>Total Amount</span>
          <span style={{ color: 'var(--st-accent)', fontSize: 20, fontWeight: 700 }}>₹{totalPrice}</span>
        </div>

        {bookMutation.isError && (
          <div style={{ background: 'rgba(255,51,51,0.1)', border: '1px solid #ff3333', borderRadius: 8, padding: 12, marginBottom: 16, color: '#ff3333', fontSize: 13, textAlign: 'center' }}>
            {getErrorMessage(bookMutation.error)}
          </div>
        )}

        <button className="mess-btn-primary" onClick={handleBook} disabled={bookMutation.isPending}>
          {bookMutation.isPending ? 'Booking...' : `Confirm Booking — ₹${totalPrice}`}
        </button>

        <div className="mess-note">
          <strong>Note:</strong> After booking, you'll receive a QR code valid until the end of the day. The amount will be added to your accumulated mess tab based on monthly billing.
        </div>
      </div>
    </div>
  );
};

export default ExtrasBookingModal;
