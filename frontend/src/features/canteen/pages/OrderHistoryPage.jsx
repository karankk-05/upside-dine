import { useNavigate } from "react-router-dom";
import { useOrderHistory } from "../hooks/useOrderHistory";

export default function OrderHistoryPage() {
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useOrderHistory();

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
      case "confirmed":
        return "text-yellow-400";
      case "preparing":
        return "text-blue-400";
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
        Your Orders
      </h1>

      {orders.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          No orders yet
        </div>
      ) : (
        <div className="space-y-3">
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
                onClick={() =>
                  navigate(`/canteen/orders/${order.id}`)
                }
                className="bg-gray-900 rounded-xl p-4 border border-gray-800 cursor-pointer hover:border-red-500 transition"
              >
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

                <div className="text-xs text-gray-400 mt-2">
                  {order.items
                    .slice(0, 2)
                    .map((item) => item.menu_item.item_name)
                    .join(", ")}
                  {order.items.length > 2 && " ..."}
                </div>

                <div className="flex justify-between text-xs mt-3 text-gray-400">
                  <span>
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                  <span className="text-white font-medium">
                    ₹{total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}