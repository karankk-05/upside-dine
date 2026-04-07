import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useManagerOrders = () => {
  return useQuery({
    queryKey: ["manager-orders"],
    queryFn: async () => {
      const res = await api.get("/canteen-manager/orders/");
      return res.data?.results || res.data || [];
    },
  });
};