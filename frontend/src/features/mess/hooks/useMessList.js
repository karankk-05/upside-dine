import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useMessList = () => {
  return useQuery({
    queryKey: ['mess', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/mess/');
      return data;
    },
  });
};
