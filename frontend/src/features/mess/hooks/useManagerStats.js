import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useManagerStats = (filters = {}) => {
  return useQuery({
    queryKey: ['mess', 'manager', 'stats', filters],
    queryFn: async () => {
      const params = {};
      if (filters.booking_date_from) params.booking_date_from = filters.booking_date_from;
      if (filters.booking_date_to) params.booking_date_to = filters.booking_date_to;
      const { data } = await api.get('/mess/manager/stats/', { params });
      return data;
    },
  });
};
