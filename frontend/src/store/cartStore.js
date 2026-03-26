import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],

      addItem: (item) => {
        const state = get();

        // Prevent mixing items from different canteens
        if (
          state.cart.length > 0 &&
          state.cart[0].canteen_id !== item.canteen_id
        ) {
          return;
        }

        const existing = state.cart.find(
          (i) => i.id === item.id
        );

        if (existing) {
          set({
            cart: state.cart.map((i) =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({
            cart: [
              ...state.cart,
              {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                canteen_id: item.canteen_id,
              },
            ],
          });
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set((state) => ({
            cart: state.cart.filter((i) => i.id !== id),
          }));
          return;
        }

        set((state) => ({
          cart: state.cart.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== id),
        }));
      },

      clearCart: () => set({ cart: [] }),

      getTotal: () => {
        return get().cart.reduce(
          (sum, item) =>
            sum + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().cart.reduce(
          (count, item) => count + item.quantity,
          0
        );
      },
    }),
    {
      name: "canteen-cart",
    }
  )
);