import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId) => {
      const { data } = await api.post(`/mess/bookings/${bookingId}/cancel/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['mess', 'account'] });
    },
  });
};
