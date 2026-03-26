import { useState } from "react";
import { X, Loader2 } from "lucide-react";

import { useCreatePayment } from "../hooks/useCreatePayment";
import { useVerifyPayment } from "../hooks/useVerifyPayment";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

export default function PaymentModal({
  amount,
  orderId,
  onSuccess,
  onClose,
}) {
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createPayment } = useCreatePayment();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  const handlePayment = async () => {
    setLoading(true);

    const loaded = await loadRazorpay();
    if (!loaded) {
      alert("Razorpay SDK failed to load");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create payment order from backend
      const payment = await createPayment({
        order_id: orderId,
        amount,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: payment.amount,
        currency: "INR",
        name: "Upside Dine",
        description: "Canteen Order Payment",
        order_id: payment.razorpay_order_id,

        handler: async function (response) {
          try {
            // Step 2: Verify payment
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id:
                response.razorpay_payment_id,
              razorpay_signature:
                response.razorpay_signature,
            });

            onSuccess();
          } catch (err) {
            alert("Payment verification failed");
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },

        theme: {
          color: "#ef4444",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Payment failed", err);
      alert("Payment initiation failed");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">
            Payment
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Amount */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-gray-400">
            Total Amount
          </p>
          <p className="text-2xl font-semibold text-white mt-1">
            ₹{amount}
          </p>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-medium ${
            loading
              ? "bg-gray-700 text-gray-400"
              : "bg-red-500 text-white"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </div>
          ) : (
            `Pay ₹${amount}`
          )}
        </button>
      </div>
    </div>
  );
}