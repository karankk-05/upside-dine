import { useNavigate } from "react-router-dom";

import { useManagerOrders } from "../hooks/useManagerOrders";
import { useUpdateOrderStatus } from "../hooks/useUpdateOrderStatus";
import { useOrderSocket } from "../hooks/useOrderSocket";

export default function ManagerOrdersPage() {
  const navigate = useNavigate();

  const { data: orders = [], isLoading, refetch } =
    useManagerOrders();

  const { mutate: updateStatus } = useUpdateOrderStatus();

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "confirmed":
        return "text-blue-400";
      case "preparing":
        return "text-purple-400";
      case "ready":
        return "text-green-400";
      case "picked_up":
        return "text-gray-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    updateStatus(
      { orderId, status: newStatus },
      {
        onSuccess: () => refetch(),
      }
    );
  };

  // Optional: refresh on socket updates (simple global refresh)
  useOrderSocket("manager", () => {
    refetch();
  });

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen p-4">
      <h1 className="text-xl font-semibold mb-4">
        Manage Orders
      </h1>

      {orders.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          No active orders
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const total = order.items.reduce(
              (sum, item) =>
                sum +
                item.menu_item.price * item.quantity,
              0
            );

            return (
              <div
                key={order.id}
                className="bg-gray-900 rounded-xl p-4 border border-gray-800"
              >
                {/* Header */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold">
                    Order #{order.id}
                  </h3>

                  <span
                    className={`text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </div>

                {/* Items */}
                <div className="text-xs text-gray-400 mt-2">
                  {order.items
                    .map(
                      (item) =>
                        `${item.menu_item.item_name} × ${item.quantity}`
                    )
                    .join(", ")}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400">
                    ₹{total}
                  </span>

                  <button
                    onClick={() =>
                      navigate(`/manager/orders/${order.id}`)
                    }
                    className="text-xs text-red-400"
                  >
                    View
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {order.status === "pending" && (
                    <button
                      onClick={() =>
                        handleStatusChange(order.id, "confirmed")
                      }
                      className="bg-blue-500 px-3 py-1 text-xs rounded"
                    >
                      Confirm
                    </button>
                  )}

                  {order.status === "confirmed" && (
                    <button
                      onClick={() =>
                        handleStatusChange(order.id, "preparing")
                      }
                      className="bg-purple-500 px-3 py-1 text-xs rounded"
                    >
                      Start Preparing
                    </button>
                  )}

                  {order.status === "preparing" && (
                    <button
                      onClick={() =>
                        handleStatusChange(order.id, "ready")
                      }
                      className="bg-green-500 px-3 py-1 text-xs rounded"
                    >
                      Mark Ready
                    </button>
                  )}

                  {order.status === "ready" && (
                    <button
                      onClick={() =>
                        handleStatusChange(order.id, "picked_up")
                      }
                      className="bg-gray-500 px-3 py-1 text-xs rounded"
                    >
                      Mark Picked Up
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}