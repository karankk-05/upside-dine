import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";

export const canteenDetailQueryKey = (id) => ["canteen", id];

export const fetchCanteenDetail = async (id) => {
  const res = await api.get(`/canteens/${id}/`);
  return res.data;
};

export const useCanteenDetail = (id) => {
  return useQuery({
    queryKey: canteenDetailQueryKey(id),
    queryFn: () => fetchCanteenDetail(id),
    enabled: !!id,
    staleTime: 300000,
  });
};
