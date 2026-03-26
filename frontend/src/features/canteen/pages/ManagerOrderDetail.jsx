import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useOrderDetail } from "../hooks/useOrderDetail";
import { useUpdateOrderStatus } from "../hooks/useUpdateOrderStatus";
import { useOrderSocket } from "../hooks/useOrderSocket";

import OrderStatusTracker from "../components/OrderStatusTracker";

export default function ManagerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading, refetch } =
    useOrderDetail(id);

  const { mutate: updateStatus } = useUpdateOrderStatus();

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

  const total = order.items.reduce(
    (sum, item) =>
      sum + item.menu_item.price * item.quantity,
    0
  );

  const handleStatusChange = (newStatus) => {
    updateStatus(
      { orderId: order.id, status: newStatus },
      {
        onSuccess: () => refetch(),
      }
    );
  };

  return (
    <div className="bg-black text-white min-h-screen p-4 pb-24">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-400 mb-4"
      >
        ← Back
      </button>

      <h2 className="text-lg font-semibold mb-4">
        Order #{order.id}
      </h2>

      {/* Status Tracker */}
      <OrderStatusTracker status={currentStatus} />

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
          <span>₹{total}</span>
        </div>
      </div>

      {/* Customer Info */}
      {order.user && (
        <div className="bg-gray-900 rounded-xl p-4 mt-4">
          <h3 className="text-sm font-semibold mb-2">
            Customer
          </h3>
          <p className="text-xs text-gray-400">
            {order.user.username}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 space-y-2">
        {currentStatus === "pending" && (
          <button
            onClick={() => handleStatusChange("confirmed")}
            className="w-full bg-blue-500 py-2 rounded"
          >
            Confirm Order
          </button>
        )}

        {currentStatus === "confirmed" && (
          <button
            onClick={() => handleStatusChange("preparing")}
            className="w-full bg-purple-500 py-2 rounded"
          >
            Start Preparing
          </button>
        )}

        {currentStatus === "preparing" && (
          <button
            onClick={() => handleStatusChange("ready")}
            className="w-full bg-green-500 py-2 rounded"
          >
            Mark as Ready
          </button>
        )}

        {currentStatus === "ready" && (
          <button
            onClick={() => handleStatusChange("picked_up")}
            className="w-full bg-gray-500 py-2 rounded"
          >
            Mark as Picked Up
          </button>
        )}

        {currentStatus !== "picked_up" &&
          currentStatus !== "cancelled" && (
            <button
              onClick={() =>
                handleStatusChange("cancelled")
              }
              className="w-full bg-red-500 py-2 rounded"
            >
              Cancel Order
            </button>
          )}
      </div>
    </div>
  );
}