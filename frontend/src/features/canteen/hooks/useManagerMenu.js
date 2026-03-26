import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useManagerMenu = () => {
  return useQuery({
    queryKey: ["manager-menu"],
    queryFn: async () => {
      const res = await api.get("/manager/menu/");
      return res.data;
    },
  });
};