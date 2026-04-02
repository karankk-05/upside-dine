import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useCanteenList = () => {
  return useQuery({
    queryKey: ["canteens"],
    queryFn: async () => {
      const res = await api.get("/canteens/");
      return res.data;
    },
  });
};