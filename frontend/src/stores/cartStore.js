import { create } from "zustand";
import { persist } from "zustand/middleware";

const normalizeCanteenKey = (canteenId) => {
  if (canteenId === null || canteenId === undefined || canteenId === "") {
    return null;
  }

  return String(canteenId);
};

const getCartItemsForCanteen = (cartsByCanteen, canteenId) => {
  const canteenKey = normalizeCanteenKey(canteenId);
  if (!canteenKey) {
    return [];
  }

  return cartsByCanteen[canteenKey] ?? [];
};

const updateCanteenCart = (cartsByCanteen, canteenId, nextCart) => {
  const canteenKey = normalizeCanteenKey(canteenId);
  if (!canteenKey) {
    return cartsByCanteen;
  }

  const nextCartsByCanteen = { ...cartsByCanteen };

  if (nextCart.length === 0) {
    delete nextCartsByCanteen[canteenKey];
  } else {
    nextCartsByCanteen[canteenKey] = nextCart;
  }

  return nextCartsByCanteen;
};

export const migrateCartState = (persistedState) => {
  const existingCarts = persistedState?.cartsByCanteen;
  if (existingCarts && typeof existingCarts === "object" && !Array.isArray(existingCarts)) {
    const sanitizedCarts = Object.entries(existingCarts).reduce(
      (nextCarts, [canteenKey, cartItems]) => {
        if (Array.isArray(cartItems) && cartItems.length > 0) {
          nextCarts[canteenKey] = cartItems;
        }
        return nextCarts;
      },
      {}
    );

    return {
      ...persistedState,
      cartsByCanteen: sanitizedCarts,
    };
  }

  const legacyCart = Array.isArray(persistedState?.cart) ? persistedState.cart : [];
  const cartsByCanteen = legacyCart.reduce((nextCarts, item) => {
    const canteenKey = normalizeCanteenKey(item?.canteen_id);
    if (!canteenKey) {
      return nextCarts;
    }

    if (!nextCarts[canteenKey]) {
      nextCarts[canteenKey] = [];
    }

    nextCarts[canteenKey].push(item);
    return nextCarts;
  }, {});

  return {
    ...persistedState,
    cartsByCanteen,
  };
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartsByCanteen: {},

      addItem: (item) => {
        set((state) => {
          const currentCart = getCartItemsForCanteen(
            state.cartsByCanteen,
            item.canteen_id
          );
          const existingItem = currentCart.find((cartItem) => cartItem.id === item.id);

          const nextCart = existingItem
            ? currentCart.map((cartItem) =>
                cartItem.id === item.id
                  ? { ...cartItem, quantity: cartItem.quantity + 1 }
                  : cartItem
              )
            : [
                ...currentCart,
                {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: 1,
                  canteen_id: item.canteen_id,
                },
              ];

          return {
            cartsByCanteen: updateCanteenCart(
              state.cartsByCanteen,
              item.canteen_id,
              nextCart
            ),
          };
        });
      },

      updateQuantity: (canteenId, id, quantity) => {
        set((state) => ({
          cartsByCanteen: updateCanteenCart(
            state.cartsByCanteen,
            canteenId,
            quantity <= 0
              ? getCartItemsForCanteen(state.cartsByCanteen, canteenId).filter(
                  (item) => item.id !== id
                )
              : getCartItemsForCanteen(state.cartsByCanteen, canteenId).map((item) =>
                  item.id === id ? { ...item, quantity } : item
                )
          ),
        }));
      },

      removeItem: (canteenId, id) => {
        set((state) => ({
          cartsByCanteen: updateCanteenCart(
            state.cartsByCanteen,
            canteenId,
            getCartItemsForCanteen(state.cartsByCanteen, canteenId).filter(
              (item) => item.id !== id
            )
          ),
        }));
      },

      clearCart: (canteenId) => {
        if (canteenId === undefined) {
          set({ cartsByCanteen: {} });
          return;
        }

        set((state) => ({
          cartsByCanteen: updateCanteenCart(state.cartsByCanteen, canteenId, []),
        }));
      },

      getCart: (canteenId) => {
        return getCartItemsForCanteen(get().cartsByCanteen, canteenId);
      },

      getTotal: (canteenId) => {
        return getCartItemsForCanteen(get().cartsByCanteen, canteenId).reduce(
          (sum, item) =>
            sum + item.price * item.quantity,
          0
        );
      },

      getItemCount: (canteenId) => {
        return getCartItemsForCanteen(get().cartsByCanteen, canteenId).reduce(
          (count, item) => count + item.quantity,
          0
        );
      },

      getCartCanteenIds: () => {
        return Object.keys(get().cartsByCanteen)
          .filter((canteenKey) => get().cartsByCanteen[canteenKey]?.length > 0)
          .map((canteenKey) => Number(canteenKey))
          .filter((canteenId) => Number.isInteger(canteenId));
      },
    }),
    {
      name: "canteen-cart",
      version: 2,
      migrate: (persistedState) => migrateCartState(persistedState),
    }
  )
);
