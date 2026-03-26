import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useCanteenList = () => {
  return useQuery({
    queryKey: ["canteens"],
    queryFn: async () => {
      const res = await api.get("/canteens/");
      return res.data;
    },
  });
};