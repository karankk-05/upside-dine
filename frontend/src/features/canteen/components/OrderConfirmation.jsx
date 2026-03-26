import { CheckCircle } from "lucide-react";

export default function OrderConfirmation({ order, onClose }) {
  if (!order) return null;

  const formatTime = (time) => {
    if (!time) return "—";
    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (time) => {
    if (!time) return "—";
    return new Date(time).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md text-center">
        {/* Success Icon */}
        <CheckCircle
          size={48}
          className="text-green-500 mx-auto mb-3"
        />

        <h2 className="text-lg font-semibold mb-1">
          Order Placed Successfully
        </h2>

        <p className="text-xs text-gray-400 mb-4">
          Your order has been confirmed
        </p>

        {/* Order Info */}
        <div className="bg-gray-800 rounded-xl p-4 text-left text-sm space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">
              Order No.
            </span>
            <span>{order.order_number}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Canteen
            </span>
            <span>{order.canteen_name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Order Type
            </span>
            <span className="capitalize">
              {order.order_type}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Total
            </span>
            <span>₹{order.total_amount}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Status
            </span>
            <span className="text-green-400 capitalize">
              {order.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Ready By
            </span>
            <span>
              {formatTime(order.estimated_ready_time)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Placed At
            </span>
            <span>
              {formatDate(order.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full bg-red-500 py-2 rounded-xl font-medium"
          >
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
}