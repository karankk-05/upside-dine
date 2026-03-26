import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useManagerStats = () => {
  return useQuery({
    queryKey: ["manager-stats"],
    queryFn: async () => {
      const res = await api.get("/manager/stats/");
      return res.data;
    },
  });
};