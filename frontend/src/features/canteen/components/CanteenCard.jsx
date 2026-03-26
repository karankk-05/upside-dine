import { Star } from "lucide-react";

export default function CanteenCard({ canteen }) {
  const getTimeInfo = () => {
    if (!canteen.opening_time || !canteen.closing_time) {
      return { isOpen: true, text: "" };
    }

    const now = new Date();

    const [openH, openM] = canteen.opening_time.split(":").map(Number);
    const [closeH, closeM] = canteen.closing_time.split(":").map(Number);

    const open = new Date();
    open.setHours(openH, openM, 0, 0);

    const close = new Date();
    close.setHours(closeH, closeM, 0, 0);

    let isOpen;

    if (close > open) {
      isOpen = now >= open && now <= close;
    } else {
      isOpen = now >= open || now <= close;
    }

    let text = "";

    if (isOpen) {
      let closeTime = new Date(close);

      if (close < open && now >= open) {
        closeTime.setDate(closeTime.getDate() + 1);
      }

      const diffMs = closeTime - now;
      const diffMin = Math.max(0, Math.floor(diffMs / 60000));

      if (diffMin <= 60) {
        text = `Closes in ${diffMin} min`;
      } else {
        text = `Closes at ${canteen.closing_time.slice(0, 5)}`;
      }
    } else {
      text = `Opens at ${canteen.opening_time.slice(0, 5)}`;
    }

    return { isOpen, text };
  };

  const { isOpen, text } = getTimeInfo();

  return (
    <div
      className={`bg-gray-900 rounded-xl overflow-hidden border border-gray-800 transition cursor-pointer ${
        !isOpen ? "opacity-60" : "hover:border-red-500"
      }`}
    >
      {/* Header */}
      <div className="p-3">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-semibold text-white">
            {canteen.name}
          </h3>

          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isOpen
                ? "bg-green-500 text-black"
                : "bg-red-500 text-white"
            }`}
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>

        {/* Rating + delivery */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
          <div className="flex items-center gap-1">
            <Star
              size={14}
              className="text-yellow-400 fill-yellow-400"
            />
            <span>{canteen.rating || "4.0"}</span>
          </div>

          <span>•</span>

          {canteen.is_delivery_available ? (
            <span>₹{canteen.delivery_fee} delivery</span>
          ) : (
            <span>No delivery</span>
          )}

          <span>•</span>

          <span>₹{canteen.min_order_amount} min</span>
        </div>

        {/* Location */}
        {canteen.location && (
          <div className="text-xs text-gray-500 mt-1">
            {canteen.location}
          </div>
        )}

        {/* Time info */}
        <div className="mt-2 text-xs">
          <span className={isOpen ? "text-green-400" : "text-red-400"}>
            {isOpen ? "Open" : "Closed"}
          </span>
          <span className="text-gray-400 ml-2">{text}</span>
        </div>
      </div>
    </div>
  );
}