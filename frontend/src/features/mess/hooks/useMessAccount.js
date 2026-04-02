import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useMessAccount = () => {
  return useQuery({
    queryKey: ['mess', 'account'],
    queryFn: async () => {
      const { data } = await api.get('/users/me/mess-account/');
      return data;
    },
  });
};
