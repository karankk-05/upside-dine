import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useScanHistory = () => {
  return useQuery({
    queryKey: ['mess', 'worker', 'scan-history'],
    queryFn: async () => {
      const { data } = await api.get('/mess/worker/scan-history/');
      return data;
    },
  });
};
