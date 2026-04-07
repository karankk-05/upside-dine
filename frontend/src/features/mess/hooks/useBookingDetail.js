import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useBookingDetail = (bookingId) => {
  return useQuery({
    queryKey: ['mess', 'bookings', bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/mess/bookings/${bookingId}/`);
      return data;
    },
    enabled: !!bookingId,
  });
};
