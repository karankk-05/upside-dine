import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useManagerMenu = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["manager-menu"],
    queryFn: async () => {
      const res = await api.get("/manager/menu/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/manager/menu/", data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["manager-menu"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await api.patch(`/manager/menu/${id}/`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["manager-menu"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/manager/menu/${id}/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["manager-menu"] }),
  });

  return {
    menuItems: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    addItem: addMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
  };
};