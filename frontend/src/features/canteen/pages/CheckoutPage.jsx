import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet } from 'lucide-react';
import { useCartStore } from '../../../stores/cartStore';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { usePlaceOrder } from '../hooks/usePlaceOrder';
import { useCanteenDetail } from '../hooks/useCanteenDetail';
import PaymentModal from '../components/PaymentModal';
import OrderConfirmation from '../components/OrderConfirmation';
import {
  FIELD_LIMITS,
  sanitizeLocationText,
  sanitizeMultilineText,
} from '../../../lib/formValidation';
import '../canteen.css';

const DEFAULT_PAYMENT_CONFIG = {
  payment_mode: 'both',
};

const CHECKOUT_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ben', label: 'Bengali' },
  { value: 'mar', label: 'Marathi' },
  { value: 'guj', label: 'Gujarati' },
  { value: 'tam', label: 'Tamil' },
  { value: 'tel', label: 'Telugu' },
];

const resolveInitialCheckoutLanguage = () => {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const locales = [...(navigator.languages || []), navigator.language].filter(Boolean);
  for (const locale of locales) {
    const normalizedLocale = String(locale).toLowerCase();
    if (normalizedLocale.startsWith('hi')) {
      return 'hi';
    }
    if (normalizedLocale.startsWith('bn')) {
      return 'ben';
    }
    if (normalizedLocale.startsWith('mr')) {
      return 'mar';
    }
    if (normalizedLocale.startsWith('gu')) {
      return 'guj';
    }
    if (normalizedLocale.startsWith('ta')) {
      return 'tam';
    }
    if (normalizedLocale.startsWith('te')) {
      return 'tel';
    }
  }

  return 'en';
};

const PAYMENT_METHOD_LABELS = {
  online: 'Pay with Razorpay',
  cash: 'Pay Later',
};

const getPaymentHelpText = (paymentMethod, orderType) => {
  if (paymentMethod === 'cash') {
    return orderType === 'delivery'
      ? 'Place the order now and pay when it is delivered.'
      : 'Place the order now and pay at the canteen counter during pickup.';
  }

  return 'You will complete the payment inside Razorpay after the order is placed.';
};

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
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [checkoutLanguage, setCheckoutLanguage] = useState(resolveInitialCheckoutLanguage);

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
  const { data: currentUser } = useCurrentUser({ enabled: Boolean(canteenId) });
  const { data: canteen } = useCanteenDetail(canteenId);

  const paymentConfig = canteen?.payment_config || DEFAULT_PAYMENT_CONFIG;
  const availablePaymentMethods = useMemo(() => {
    if (paymentConfig.payment_mode === 'cash') {
      return ['cash'];
    }
    if (paymentConfig.payment_mode === 'online') {
      return ['online'];
    }
    return ['online', 'cash'];
  }, [paymentConfig.payment_mode]);

  useEffect(() => {
    if (!availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0] || 'online');
    }
  }, [availablePaymentMethods, paymentMethod]);

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
        payment_method: paymentMethod === 'cash' ? 'cash' : 'razorpay',
        delivery_address: orderType === 'delivery' ? address : '',
        notes: notes || '',
      };
      if (orderType === 'prebook' && scheduledTime) {
        payload.scheduled_time = scheduledTime;
      }

      const order = await placeOrder(payload);
      const orderWithCheckoutMeta = {
        ...order,
        checkout_payment_method: paymentMethod,
        checkout_payment_config: paymentConfig,
      };
      setOrderData(orderWithCheckoutMeta);

      if (paymentMethod === 'cash') {
        setOrderPlaced(true);
        clearCart(canteenId);
        return;
      }

      setPaymentOpen(true);
    } catch (err) {
      const errData = err.response?.data;
      const msg =
        typeof errData === 'object'
          ? JSON.stringify(errData)
          : errData || 'Failed to place order';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canteenId && cartCanteenIds.length > 1) {
    return (
      <div
        className="canteen-page"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="canteen-empty">
          <div className="canteen-empty__icon">Cart</div>
          <p className="canteen-empty__text">Open checkout from a specific canteen cart.</p>
          <button
            className="canteen-btn-small canteen-btn-small--primary"
            onClick={() => navigate('/canteens')}
            style={{ marginTop: 16 }}
          >
            Browse Canteens
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div
        className="canteen-page"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="canteen-empty">
          <div className="canteen-empty__icon">Cart</div>
          <p className="canteen-empty__text">Cart is empty</p>
          <button
            className="canteen-btn-small canteen-btn-small--primary"
            onClick={() => navigate(canteenId ? `/canteens/${canteenId}` : '/canteens')}
            style={{ marginTop: 16 }}
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="canteen-checkout">
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#999',
          fontSize: 14,
          cursor: 'pointer',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Checkout</h2>

      <div className="canteen-checkout__section">
        <p className="canteen-checkout__section-title">Order Type</p>
        <div className="canteen-filter-tabs">
          {['pickup', 'delivery'].map((type) => (
            <button
              key={type}
              className={`canteen-filter-tab ${orderType === type ? 'active' : ''}`}
              onClick={() => setOrderType(type)}
              style={{ textTransform: 'capitalize' }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {orderType === 'delivery' && (
        <div className="canteen-checkout__section">
          <p className="canteen-checkout__section-title">Delivery Address</p>
          <input
            className="canteen-checkout__input"
            value={address}
            onChange={(event) =>
              setAddress(sanitizeLocationText(event.target.value, FIELD_LIMITS.address))
            }
            placeholder="Room no, Hall name..."
            maxLength={FIELD_LIMITS.address}
            autoComplete="street-address"
          />
        </div>
      )}

      {orderType === 'prebook' && (
        <div className="canteen-checkout__section">
          <p className="canteen-checkout__section-title">Schedule Time</p>
          <input
            className="canteen-checkout__input"
            type="datetime-local"
            value={scheduledTime}
            onChange={(event) => setScheduledTime(event.target.value)}
          />
        </div>
      )}

      <div className="canteen-checkout__section">
        <p className="canteen-checkout__section-title">Payment Method</p>
        <div className="canteen-filter-tabs">
          {availablePaymentMethods.map((method) => (
            <button
              key={method}
              className={`canteen-filter-tab ${paymentMethod === method ? 'active' : ''}`}
              onClick={() => setPaymentMethod(method)}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {method === 'online' ? (
                <CreditCard size={14} />
              ) : (
                <Wallet size={14} />
              )}
              {PAYMENT_METHOD_LABELS[method]}
            </button>
          ))}
        </div>
        <p style={{ color: '#9b9b9b', fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
          {getPaymentHelpText(paymentMethod, orderType)}
        </p>
        {paymentMethod === 'cash' ? (
          <p style={{ color: '#d9b06f', fontSize: 12, marginTop: 6 }}>
            This canteen accepts pay-later orders through its cash payment mode.
          </p>
        ) : null}
      </div>

      {paymentMethod === 'online' ? (
        <div className="canteen-checkout__section">
          <p className="canteen-checkout__section-title">Payment Language</p>
          <select
            className="canteen-checkout__input"
            value={checkoutLanguage}
            onChange={(event) => setCheckoutLanguage(event.target.value)}
          >
            {CHECKOUT_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p style={{ color: '#9b9b9b', fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
            Your selection is passed into Razorpay when the payment window opens.
          </p>
        </div>
      ) : null}

      <div className="canteen-checkout__section">
        <p className="canteen-checkout__section-title">Special Instructions</p>
        <textarea
          className="canteen-checkout__input"
          value={notes}
          onChange={(event) =>
            setNotes(sanitizeMultilineText(event.target.value, FIELD_LIMITS.notes))
          }
          placeholder="e.g. less spicy, no onions..."
          rows={2}
          maxLength={FIELD_LIMITS.notes}
          style={{ resize: 'none' }}
        />
      </div>

      <div className="canteen-checkout__section">
        <p className="canteen-checkout__section-title">Order Summary</p>
        {cart.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 14,
              marginBottom: 8,
              color: '#ccc',
            }}
          >
            <span>
              {item.name} x {item.quantity}
            </span>
            <span style={{ color: '#d45555' }}>Rs {item.price * item.quantity}</span>
          </div>
        ))}
        <div
          style={{
            borderTop: '1px solid #333',
            marginTop: 12,
            paddingTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          <span>Total</span>
          <span style={{ color: '#d45555' }}>Rs {total}</span>
        </div>
      </div>

      <button
        className="canteen-checkout__submit"
        onClick={handlePlaceOrder}
        disabled={submitting}
        style={{ opacity: submitting ? 0.6 : 1 }}
      >
        {submitting
          ? 'Placing Order...'
          : paymentMethod === 'cash'
            ? `Place Order and Pay Later - Rs ${total}`
            : `Continue to Payment - Rs ${total}`}
      </button>

      {paymentOpen && orderData ? (
        <PaymentModal
          amount={orderData.total_amount}
          orderId={orderData.id}
          language={checkoutLanguage}
          user={currentUser}
          onSuccess={() => {
            setPaymentOpen(false);
            setOrderPlaced(true);
            clearCart(canteenId);
          }}
          onAbort={() => {
            setPaymentOpen(false);
            setOrderData(null);
          }}
          onClose={() => setPaymentOpen(false)}
        />
      ) : null}

      {orderPlaced && orderData ? (
        <OrderConfirmation
          order={orderData}
          onClose={() => navigate(`/orders/${orderData.id}`)}
        />
      ) : null}
    </div>
  );
}
