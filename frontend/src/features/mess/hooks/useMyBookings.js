import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useMyBookings = (filters = {}) => {
  return useQuery({
    queryKey: ['mess', 'bookings', 'my', filters],
    queryFn: async () => {
      const params = {};
      if (filters.status) params.status = filters.status;
      const { data } = await api.get('/mess/bookings/', { params });
      return data;
    },
  });
};
