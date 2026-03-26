import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";

import { useCanteenDetail } from "../hooks/useCanteenDetail";
import { useCanteenMenu } from "../hooks/useCanteenMenu";
import { useCartStore } from "../../../stores/cartStore";

import MenuItemCard from "../components/MenuItemCard";
import MenuSearch from "../components/MenuSearch";
import CartDrawer from "../components/CartDrawer";

export default function CanteenDetailPage() {
  const { id } = useParams();

  const { data: canteen, isLoading: loadingDetail } = useCanteenDetail(id);
  const { data: menu = [], isLoading: loadingMenu } = useCanteenMenu(id);

  const [activeCategory, setActiveCategory] = useState("");
  const [mode, setMode] = useState("pickup");
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCartStore((state) => state.cart);

  const groupedMenu = menu.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(groupedMenu);

  useEffect(() => {
    if (categories.length > 0) {
      setActiveCategory((prev) =>
        categories.includes(prev) ? prev : categories[0]
      );
    }
  }, [categories]);

  if (loadingDetail || loadingMenu) {
    return (
      <div className="p-4 text-white bg-black min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pb-24">
      <div className="p-4 border-b border-gray-800">
        <button className="mb-2 text-sm text-gray-400">← Back</button>

        <div className="bg-gray-900 rounded-xl p-4 border border-red-500">
          <h2 className="text-lg font-semibold">{canteen.name}</h2>
          <p className="text-sm text-gray-400">
            Opens {canteen.open_time} - {canteen.close_time}
          </p>

          <div className="flex items-center gap-2 text-sm mt-2 text-gray-300">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span>{canteen.rating}</span>
            </div>
            <span>•</span>
            <span>₹{canteen.delivery_fee} delivery</span>
            <span>•</span>
            <span>₹{canteen.min_order} min</span>
          </div>
        </div>

        <div className="flex mt-4 bg-gray-800 rounded-full p-1">
          <button
            onClick={() => setMode("pickup")}
            className={`flex-1 py-2 rounded-full ${
              mode === "pickup"
                ? "bg-red-500 text-white"
                : "text-gray-400"
            }`}
          >
            Pickup
          </button>
          <button
            onClick={() => setMode("delivery")}
            className={`flex-1 py-2 rounded-full ${
              mode === "delivery"
                ? "bg-red-500 text-white"
                : "text-gray-400"
            }`}
          >
            Delivery
          </button>
        </div>
      </div>

      <div className="p-4">
        <MenuSearch />
      </div>

      <div className="flex overflow-x-auto px-4 gap-2 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeCategory === cat
                ? "bg-red-500 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {groupedMenu[activeCategory]?.map((item) => (
          <MenuItemCard
            key={item.id || item.menu_item}
            item={item}
            canteenId={canteen.id}
          />
        ))}
      </div>

      {cart.length > 0 && (
        <div
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 bg-red-500 rounded-xl p-4 flex justify-between items-center shadow-lg"
        >
          <span className="font-medium">
            View Cart ({cart.length} items)
          </span>
          <span>
            ₹
            {cart.reduce(
              (total, item) => total + item.price * item.quantity,
              0
            )}
          </span>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}