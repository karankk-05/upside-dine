import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useOrderHistory = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders/");
      return res.data;
    },
  });
};