import { useMutation } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useUpdateOrderStatus = () => {
  return useMutation({
    mutationFn: async ({ orderId, status, estimated_ready_time }) => {
      const res = await api.patch(`/manager/orders/${orderId}/`, {
        status,
        estimated_ready_time,
      });
      return res.data;
    },
  });
};