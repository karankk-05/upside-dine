import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useManagerOrders = () => {
  return useQuery({
    queryKey: ["manager-orders"],
    queryFn: async () => {
      const res = await api.get("/manager/orders/");
      return res.data;
    },
  });
};