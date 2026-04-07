import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useManagerOrderDetail = (id) => {
  return useQuery({
    queryKey: ["manager-order", id],
    queryFn: async () => {
      const res = await api.get(`/canteen-manager/orders/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
};
