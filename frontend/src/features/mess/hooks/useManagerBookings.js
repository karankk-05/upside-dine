import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useManagerBookings = (filters = {}) => {
  return useQuery({
    queryKey: ['mess', 'manager', 'bookings', filters],
    queryFn: async () => {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.meal_type) params.meal_type = filters.meal_type;
      if (filters.booking_date) params.booking_date = filters.booking_date;
      const { data } = await api.get('/mess/manager/bookings/', { params });
      return data;
    },
  });
};
