import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const MANAGER_STATS_QUERY_KEY = ["manager-stats"];

export const useManagerStats = () => {
  return useQuery({
    queryKey: MANAGER_STATS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get("/canteen-manager/stats/");
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });
};
