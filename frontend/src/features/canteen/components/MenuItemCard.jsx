import { useCartStore } from "../../../stores/cartStore";
import { Plus, Minus } from "lucide-react";

export default function MenuItemCard({ item, canteenId }) {
  const { cart, addItem, updateQuantity } = useCartStore();

  const itemId = item.id;
  const quantity =
    cart.find((i) => i.id === itemId)?.quantity || 0;

  const isVeg = item.is_veg;
  const isAvailable =
    item.is_available && item.available_quantity > 0;

  const handleAdd = () => {
    if (!isAvailable) return;

    addItem({
      id: itemId,
      name: item.item_name,
      price: item.price,
      canteen_id: canteenId,
    });
  };

  const increment = () => {
    addItem({
      id: itemId,
      name: item.item_name,
      price: item.price,
      canteen_id: canteenId,
    });
  };

  const decrement = () => {
    if (quantity === 1) {
      updateQuantity(itemId, 0);
    } else {
      updateQuantity(itemId, quantity - 1);
    }
  };

  return (
    <div
      className={`flex justify-between items-center bg-gray-900 rounded-xl p-4 border border-gray-800 ${
        !isAvailable ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1 pr-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isVeg ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <h3 className="text-sm font-semibold">
            {item.item_name}
          </h3>
        </div>

        {item.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span>₹{item.price}</span>
          {item.preparation_time_mins && (
            <span>
              {item.preparation_time_mins} min
            </span>
          )}
        </div>

        {!isAvailable && (
          <p className="text-xs text-red-400 mt-1">
            Out of stock
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        )}

        {quantity === 0 ? (
          <button
            onClick={handleAdd}
            disabled={!isAvailable}
            className={`text-sm px-4 py-1 rounded-full ${
              isAvailable
                ? "bg-red-500 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            Add
          </button>
        ) : (
          <div className="flex items-center bg-gray-800 rounded-full px-2 py-1 gap-2">
            <button onClick={decrement}>
              <Minus size={14} />
            </button>

            <span className="text-sm">{quantity}</span>

            <button onClick={increment}>
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}