import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { useCreatePayment } from '../hooks/useCreatePayment';
import { useVerifyPayment } from '../hooks/useVerifyPayment';
import '../canteen.css';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const getPaymentErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || fallback;

const normalizeCheckoutLanguage = (language) => {
  const normalized = String(language || 'en').trim().toLowerCase();
  const supportedLanguages = new Set(['en', 'hi', 'ben', 'mar', 'guj', 'tam', 'tel']);
  return supportedLanguages.has(normalized) ? normalized : 'en';
};

export default function PaymentModal({ amount, orderId, language = 'en', user = null, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const { mutateAsync: createPayment } = useCreatePayment();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  const handlePayment = async () => {
    setLoading(true);
    const loaded = await loadRazorpay();
    if (!loaded) { alert('Razorpay SDK failed to load'); setLoading(false); return; }

    try {
      const res = await createPayment({ order_id: orderId, amount });
      const rzpOrderId = res.payment?.razorpay_order_id || res.razorpay_order?.id;
      const rzpAmount = res.razorpay_order?.amount || amount * 100;
      const selectedLanguage = normalizeCheckoutLanguage(language);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || res.razorpay_key_id,
        amount: rzpAmount,
        currency: 'INR',
        name: 'Upside Dine',
        description: 'Canteen Order Payment',
        order_id: rzpOrderId,
        prefill: {
          name: user?.profile?.full_name || user?.email?.split('@')[0] || 'Student',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        config: {
          display: {
            language: selectedLanguage,
          },
        },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onSuccess();
          } catch (error) {
            alert(getPaymentErrorMessage(error, 'Payment verification failed'));
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: '#d45555' },
      };
      new window.Razorpay(options).open();
    } catch (error) {
      alert(getPaymentErrorMessage(error, 'Payment initiation failed'));
      setLoading(false);
    }
  };

  return (
    <div className="canteen-payment-overlay">
      <div className="canteen-payment-backdrop" onClick={onClose} />
      <div className="canteen-payment-sheet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Payment</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="canteen-payment-amount">
          <p className="canteen-payment-amount__label">Total Amount</p>
          <p className="canteen-payment-amount__value">₹{amount}</p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: '100%', padding: 16, background: loading ? '#333' : '#d45555',
            border: 'none', borderRadius: 12, color: '#fff', fontSize: 16,
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(232, 85, 85, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? <><Loader size={16} style={{ animation: 'canteen-spin 0.8s linear infinite' }} /> Processing...</> : `Pay ₹${amount}`}
        </button>
      </div>
    </div>
  );
}
