import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useOrderDetail = (id) => {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
};