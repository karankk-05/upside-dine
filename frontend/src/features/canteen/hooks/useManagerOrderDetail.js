import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const managerOrderDetailQueryKey = (id) => ["manager-order", id];

export const useManagerOrderDetail = (id) => {
  return useQuery({
    queryKey: managerOrderDetailQueryKey(id),
    queryFn: async () => {
      const res = await api.get(`/canteen-manager/orders/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
};
