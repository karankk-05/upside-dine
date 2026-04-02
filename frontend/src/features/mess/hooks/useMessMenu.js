import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useMessMenu = (messId, filters = {}) => {
  return useQuery({
    queryKey: ['mess', 'menu', messId, filters],
    queryFn: async () => {
      const params = {};
      if (filters.meal_type) params.meal_type = filters.meal_type;
      if (filters.day_of_week) params.day_of_week = filters.day_of_week;
      const { data } = await api.get(`/mess/${messId}/menu/`, { params });
      return data;
    },
    enabled: !!messId,
  });
};
