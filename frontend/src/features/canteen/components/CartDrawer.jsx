import { useCartStore } from "../../../stores/cartStore";
import { X, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();

  const { cart, addItem, updateQuantity, clearCart } = useCartStore();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">
            Your Cart
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            Cart is empty
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b border-gray-800 pb-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    ₹{item.price}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (item.quantity === 1) {
                        updateQuantity(item.id, 0);
                      } else {
                        updateQuantity(
                          item.id,
                          item.quantity - 1
                        );
                      }
                    }}
                    className="bg-gray-800 p-1 rounded"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="text-sm text-white">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => addItem(item)}
                    className="bg-gray-800 p-1 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate(
                  `/canteen/${cart[0]?.canteen_id}/checkout`
                );
              }}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-medium"
            >
              Proceed to Checkout
            </button>

            <button
              onClick={() => {
                clearCart();
                onClose();
              }}
              className="w-full mt-2 text-sm text-gray-400"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}