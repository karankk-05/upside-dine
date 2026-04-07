import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useManagerInventory = () => {
  return useQuery({
    queryKey: ['mess', 'manager', 'inventory'],
    queryFn: async () => {
      const { data } = await api.get('/mess/manager/inventory/');
      return data;
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ menu_item_id, available_quantity, default_quantity }) => {
      const payload = { menu_item_id };
      if (available_quantity !== undefined) payload.available_quantity = available_quantity;
      if (default_quantity !== undefined) payload.default_quantity = default_quantity;
      const { data } = await api.patch('/mess/manager/inventory/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'manager', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['mess', 'manager', 'menu'] });
    },
  });
};
