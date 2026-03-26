import { useMutation } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useCancelOrder = () => {
  return useMutation({
    mutationFn: async ({ orderId, reason }) => {
      const res = await api.post(`/orders/${orderId}/cancel/`, {
        reason,
      });
      return res.data;
    },
  });
};