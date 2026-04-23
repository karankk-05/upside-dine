import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const MANAGER_ORDERS_QUERY_KEY = ["manager-orders"];

export const useManagerOrders = () => {
  return useQuery({
    queryKey: MANAGER_ORDERS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get("/canteen-manager/orders/");
      return res.data?.results || res.data || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });
};
