import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useBookExtras = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ menu_item, quantity, meal_type, mess_id }) => {
      const { data } = await api.post('/mess/extras/book/', {
        menu_item,
        quantity,
        meal_type,
        mess_id,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'menu'] });
      queryClient.invalidateQueries({ queryKey: ['mess', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['mess', 'account'] });
    },
  });
};
