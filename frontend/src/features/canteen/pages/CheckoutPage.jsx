import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCartStore } from '../../../stores/cartStore';
import { usePlaceOrder } from '../hooks/usePlaceOrder';
import PaymentModal from '../components/PaymentModal';
import OrderConfirmation from '../components/OrderConfirmation';
import {
  FIELD_LIMITS,
  sanitizeLocationText,
  sanitizeMultilineText,
} from '../../../lib/formValidation';
import '../canteen.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cartCanteenIds = useCartStore((state) => state.getCartCanteenIds());
  const clearCart = useCartStore((state) => state.clearCart);
  const { mutateAsync: placeOrder } = usePlaceOrder();
  const [orderType, setOrderType] = useState('pickup');
  const [address, setAddress] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canteenParam = searchParams.get('canteen');
  const parsedCanteenId = canteenParam ? Number(canteenParam) : null;
  const canteenId =
    Number.isInteger(parsedCanteenId) && parsedCanteenId > 0
      ? parsedCanteenId
      : cartCanteenIds.length === 1
        ? cartCanteenIds[0]
        : null;
  const cart = useCartStore((state) => (canteenId ? state.getCart(canteenId) : []));
  const total = useCartStore((state) => (canteenId ? state.getTotal(canteenId) : 0));

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      if (!canteenId || cart.length === 0) {
        alert('Select a canteen cart before placing an order.');
        setSubmitting(false);
        return;
      }

      const payload = {
        canteen_id: canteenId,
        items: cart.map((item) => ({ menu_item: item.id, quantity: item.quantity })),
        order_type: orderType === 'prebook' ? 'prebooking' : orderType,
        delivery_address: orderType === 'delivery' ? address : '',
        notes: notes || '',
      };
      if (orderType === 'prebook' && scheduledTime) {
        payload.scheduled_time = scheduledTime;
      }
      const order = await placeOrder(payload);
      setOrderData(order);
      setPaymentOpen(true);
    } catch (err) {
      const errData = err.response?.data;
      const msg = typeof errData === 'object' ? JSON.stringify(errData) : (errData || 'Failed to place order');
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canteenId && cartCanteenIds.length > 1) {
    return (
      <div className="canteen-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="canteen-empty">
          <div className="canteen-empty__icon">ðŸ›’</div>
          <p className="canteen-empty__text">Open checkout from a specific canteen cart.</p>
          <button className="canteen-btn-small canteen-btn-small--primary" onClick={() => navigate('/canteens')} style={{ marginTop: 16 }}>
            Browse Canteens
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="canteen-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="canteen-empty">
          <div className="canteen-empty__icon">🛒</div>
          <p className="canteen-empty__text">Cart is empty</p>
          <button className="canteen-btn-small canteen-btn-small--primary" onClick={() => navigate(canteenId ? `/canteens/${canteenId}` : '/canteens')} style={{ marginTop: 16 }}>Browse Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="canteen-checkout">
      <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#999', fontSize: 14, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Checkout</h2>

      {/* Order Type */}
      <div className="canteen-checkout__section">
        <p className="canteen-checkout__section-title">Order Type</p>
        <div className="canteen-filter-tabs">
          {['pickup', 'delivery'].map((type) => (
            <button key={type} className={`canteen-filter-tab ${orderType === type ? 'active' : ''}`} onClick={() => setOrderType(type)} style={{ textTransform: 'capitalize' }}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      {orderType === 'delivery' && (
        <div className="canteen-checkout__section">
          <p className="canteen-checkout__section-title">Delivery Address</p>
          <input className="canteen-checkout__input" value={address} onChange={(e) => setAddress(sanitizeLocationText(e.target.value, FIELD_LIMITS.address))} placeholder="Room no, Hall name..." maxLength={FIELD_LIMITS.address} autoComplete="street-address" />
        </div>
      )}

      {/* Scheduled Time */}
      {orderType === 'prebook' && (
        <div className="canteen-checkout__section">
          <p className="canteen-checkout__section-title">Schedule Time</p>
          <input className="canteen-checkout__input" type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
        </div>
      )}

      {/* Notes */}
      <div className="canteen-checkout__section">
        <p className="canteen-checkout__section-title">Special Instructions</p>
        <textarea className="canteen-checkout__input" value={notes} onChange={(e) => setNotes(sanitizeMultilineText(e.target.value, FIELD_LIMITS.notes))} placeholder="e.g. less spicy, no onions..." rows={2} maxLength={FIELD_LIMITS.notes} style={{ resize: 'none' }} />
      </div>

      {/* Order Summary */}
      <div className="canteen-checkout__section">
        <p className="canteen-checkout__section-title">Order Summary</p>
        {cart.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, color: '#ccc' }}>
            <span>{item.name} × {item.quantity}</span>
            <span style={{ color: '#d45555' }}>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #333', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
          <span>Total</span>
          <span style={{ color: '#d45555' }}>₹{total}</span>
        </div>
      </div>

      {/* Submit */}
      <button className="canteen-checkout__submit" onClick={handlePlaceOrder} disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
        {submitting ? 'Placing Order...' : `Continue to Payment • ₹${total}`}
      </button>

      {/* Payment Modal */}
      {paymentOpen && orderData && (
        <PaymentModal amount={orderData.total_amount} orderId={orderData.id} onSuccess={() => { setPaymentOpen(false); setOrderPlaced(true); clearCart(canteenId); }} onClose={() => setPaymentOpen(false)} />
      )}

      {/* Confirmation */}
      {orderPlaced && orderData && (
        <OrderConfirmation order={orderData} onClose={() => navigate(`/orders/${orderData.id}`)} />
      )}
    </div>
  );
}
