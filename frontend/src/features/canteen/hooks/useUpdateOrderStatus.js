import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, estimated_ready_time, delivery_person_id }) => {
      const body = { status, estimated_ready_time };
      if (delivery_person_id) body.delivery_person_id = delivery_person_id;
      const res = await api.patch(`/canteen-manager/orders/${id}/status/`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-orders"] });
    },
  });
};