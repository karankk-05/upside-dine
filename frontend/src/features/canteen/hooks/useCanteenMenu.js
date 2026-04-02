import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useCanteenMenu = (canteenId) => {
  return useQuery({
    queryKey: ["menu", canteenId],
    queryFn: async () => {
      const res = await api.get(`/canteens/${canteenId}/menu/`);
      return res.data;
    },
    enabled: !!canteenId,
  });
};