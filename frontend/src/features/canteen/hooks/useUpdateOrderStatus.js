import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, estimated_ready_time }) => {
      const res = await api.patch(`/manager/orders/${id}/`, {
        status,
        estimated_ready_time,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-orders"] });
    },
  });
};