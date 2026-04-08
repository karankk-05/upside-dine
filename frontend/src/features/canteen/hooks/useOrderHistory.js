import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

const TERMINAL_ORDER_STATUSES = new Set(["picked_up", "delivered", "cancelled", "rejected"]);

export const useOrderHistory = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders/");
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (query) => {
      const orders = query.state.data;
      const normalizedOrders = Array.isArray(orders) ? orders : orders?.results || [];
      return normalizedOrders.some((order) => !TERMINAL_ORDER_STATUSES.has(order?.status)) ? 5000 : false;
    },
    refetchIntervalInBackground: true,
  });
};
