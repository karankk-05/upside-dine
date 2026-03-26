import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useCanteenDetail = (id) => {
  return useQuery({
    queryKey: ["canteen", id],
    queryFn: async () => {
      const res = await api.get(`/canteens/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
};