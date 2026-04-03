import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useMenuSearch = (query) => {
  return useQuery({
    queryKey: ["menu-search", query],
    queryFn: async () => {
      const res = await api.get(`/menu/search/?q=${query}`);
      return res.data;
    },
    enabled: !!query,
  });
};