import { useMutation } from "@tanstack/react-query";
import api from "../../../lib/api";

export const usePlaceOrder = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/orders/", {
        ...data,
        items: data.items.map((i) => ({
          menu_item_id: i.menu_item, 
          quantity: i.quantity,
        })),
      });
      return res.data;
    },
  });
};