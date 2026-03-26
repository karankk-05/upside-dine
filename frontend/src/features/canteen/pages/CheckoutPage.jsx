import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCartStore } from "../../../stores/cartStore";
import { usePlaceOrder } from "../hooks/usePlaceOrder";

import PaymentModal from "../components/PaymentModal";
import OrderConfirmation from "../components/OrderConfirmation";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const { cart, clearCart } = useCartStore();
  const { mutateAsync: placeOrder } = usePlaceOrder();

  const [orderType, setOrderType] = useState("pickup");
  const [address, setAddress] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const localSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    try {
      const payload = {
        items: cart.map((item) => ({
          menu_item: item.id,
          quantity: item.quantity,
        })),
        order_type: orderType,
        delivery_address:
          orderType === "delivery" ? address : null,
        scheduled_time:
          orderType === "prebook" ? scheduledTime : null,
        notes,
      };

      const order = await placeOrder(payload);

      setOrderData(order);
      setPaymentOpen(true);
    } catch (err) {
      console.error("Order creation failed", err);
    }
  };

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Cart is empty
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen p-4 pb-28">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-400 mb-4"
      >
        ← Back
      </button>

      <h2 className="text-lg font-semibold mb-4">
        Checkout
      </h2>

      {/* Order Type */}
      <div className="bg-gray-900 p-4 rounded-xl mb-4">
        <p className="text-sm mb-2">Order Type</p>
        <div className="flex gap-2">
          {["pickup", "delivery", "prebook"].map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                orderType === type
                  ? "bg-red-500 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      {orderType === "delivery" && (
        <div className="bg-gray-900 p-4 rounded-xl mb-4">
          <p className="text-sm mb-2">Delivery Address</p>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
            className="w-full bg-gray-800 p-2 rounded outline-none text-sm"
          />
        </div>
      )}

      {/* Scheduled Time */}
      {orderType === "prebook" && (
        <div className="bg-gray-900 p-4 rounded-xl mb-4">
          <p className="text-sm mb-2">Schedule Time</p>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) =>
              setScheduledTime(e.target.value)
            }
            className="w-full bg-gray-800 p-2 rounded outline-none text-sm"
          />
        </div>
      )}

      {/* Notes */}
      <div className="bg-gray-900 p-4 rounded-xl mb-4">
        <p className="text-sm mb-2">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. less spicy"
          className="w-full bg-gray-800 p-2 rounded outline-none text-sm"
        />
      </div>

      {/* Order Summary */}
      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex justify-between text-sm"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}

        <div className="border-t border-gray-800 pt-3 flex justify-between">
          <span>Subtotal</span>
          <span>₹{localSubtotal}</span>
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={handlePlaceOrder}
        className="fixed bottom-4 left-4 right-4 bg-red-500 py-3 rounded-xl font-medium"
      >
        Continue to Payment
      </button>

      {/* Payment Modal */}
      {paymentOpen && orderData && (
        <PaymentModal
          amount={orderData.total_amount}
          orderId={orderData.id}
          onSuccess={() => {
            setPaymentOpen(false);
            setOrderPlaced(true);
            clearCart();
          }}
          onClose={() => setPaymentOpen(false)}
        />
      )}

      {/* Order Confirmation */}
      {orderPlaced && orderData && (
        <OrderConfirmation
          order={orderData}
          onClose={() => navigate("/canteen/orders")}
        />
      )}
    </div>
  );
}