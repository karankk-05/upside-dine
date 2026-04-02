import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useOrderHistory = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders/");
      return res.data;
    },
  });
};