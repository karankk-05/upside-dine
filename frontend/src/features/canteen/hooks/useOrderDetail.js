import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

const TERMINAL_ORDER_STATUSES = new Set(["picked_up", "delivered", "cancelled", "rejected"]);

export const useOrderDetail = (id) => {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}/`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_ORDER_STATUSES.has(status) ? false : 5000;
    },
    refetchIntervalInBackground: true,
  });
};
