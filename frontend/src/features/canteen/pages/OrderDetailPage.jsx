import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useOrderDetail } from "../hooks/useOrderDetail";
import { useOrderSocket } from "../hooks/useOrderSocket";

import OrderStatusTracker from "../components/OrderStatusTracker";
import PickupQRCode from "../components/PickupQRCode";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useOrderDetail(id);

  const [liveStatus, setLiveStatus] = useState(null);

  useOrderSocket(id, (newStatus) => {
    setLiveStatus(newStatus);
  });

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Order not found
      </div>
    );
  }

  const currentStatus = liveStatus || order.status;

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
    <div className="bg-black text-white min-h-screen p-4 pb-24">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-400 mb-4"
      >
        ← Back
      </button>

      {/* Header */}
      <h2 className="text-lg font-semibold mb-2">
        Order #{order.order_number}
      </h2>

      <p className="text-xs text-gray-400 mb-4">
        Placed at {formatDate(order.created_at)}
      </p>

      {/* Status Tracker */}
      <OrderStatusTracker status={currentStatus} />

      {/* Estimated Ready Time */}
      {order.estimated_ready_time && (
        <div className="bg-gray-900 rounded-xl p-3 mt-4 text-sm">
          <span className="text-gray-400">
            Estimated Ready Time:
          </span>
          <span className="ml-2 text-white">
            {formatTime(order.estimated_ready_time)}
          </span>
        </div>
      )}

      {/* Items */}
      <div className="bg-gray-900 rounded-xl p-4 space-y-3 mt-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between text-sm"
          >
            <span>
              {item.menu_item.item_name} × {item.quantity}
            </span>
            <span>
              ₹{item.menu_item.price * item.quantity}
            </span>
          </div>
        ))}

        <div className="border-t border-gray-800 pt-3 flex justify-between font-medium">
          <span>Total</span>
          <span>₹{order.total_amount}</span>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-gray-900 rounded-xl p-4 mt-4">
          <p className="text-xs text-gray-400 mb-1">
            Notes
          </p>
          <p className="text-sm">{order.notes}</p>
        </div>
      )}

      {/* Pickup Section */}
      {currentStatus === "ready" && (
        <div className="mt-4 space-y-3">
          <PickupQRCode
            orderId={order.id}
            qrValue={order.pickup_qr_code}
          />

          {order.pickup_otp && (
            <div className="bg-gray-900 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">
                Pickup OTP
              </p>
              <p className="text-lg font-semibold tracking-widest">
                {order.pickup_otp}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status Timeline */}
      {order.status_timeline?.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 mt-4">
          <h3 className="text-sm font-semibold mb-2">
            Status Timeline
          </h3>

          <div className="space-y-2 text-xs text-gray-400">
            {order.status_timeline.map((entry, index) => (
              <div
                key={index}
                className="flex justify-between"
              >
                <span className="capitalize">
                  {entry.status}
                </span>
                <span>{formatTime(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}