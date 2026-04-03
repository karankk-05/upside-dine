import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId) => {
      const res = await api.post(`/orders/${orderId}/cancel/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};