import { CheckCircle, Circle } from "lucide-react";

const STATUS_STEPS = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
];

const STATUS_LABELS = {
  pending: "Order Placed",
  confirmed: "Order Confirmed",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  picked_up: "Completed",
};

export default function OrderStatusTracker({ status }) {
  if (status === "cancelled") {
    return (
      <div className="bg-gray-900 rounded-xl p-4 text-red-500">
        Order Cancelled
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-4 text-white">
        Order Status
      </h3>

      <div className="flex flex-col gap-4">
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div key={step} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {isCompleted ? (
                  <CheckCircle size={18} className="text-green-500" />
                ) : isActive ? (
                  <CheckCircle size={18} className="text-red-500" />
                ) : (
                  <Circle size={18} className="text-gray-600" />
                )}

                {index !== STATUS_STEPS.length - 1 && (
                  <div
                    className={`w-[2px] h-6 ${
                      index < currentIndex
                        ? "bg-green-500"
                        : "bg-gray-700"
                    }`}
                  />
                )}
              </div>

              <div>
                <p
                  className={`text-sm ${
                    isActive
                      ? "text-white font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {STATUS_LABELS[step]}
                </p>

                {isActive && (
                  <p className="text-xs text-gray-500">
                    In progress...
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}