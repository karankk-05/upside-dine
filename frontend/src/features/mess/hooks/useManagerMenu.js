import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useManagerMenuList = (filters = {}) => {
  return useQuery({
    queryKey: ['mess', 'manager', 'menu', filters],
    queryFn: async () => {
      const params = {};
      if (filters.meal_type) params.meal_type = filters.meal_type;
      if (filters.day_of_week) params.day_of_week = filters.day_of_week;
      const { data } = await api.get('/mess/manager/menu/', { params });
      return data;
    },
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemData) => {
      const { data } = await api.post('/mess/manager/menu/', itemData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'manager', 'menu'] });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...itemData }) => {
      const { data } = await api.patch(`/mess/manager/menu/${id}/`, itemData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'manager', 'menu'] });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/mess/manager/menu/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'manager', 'menu'] });
    },
  });
};
