import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { compareNaturalText } from '../../../lib/naturalSort';

export const useMessList = () => {
  return useQuery({
    queryKey: ['mess', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/mess/');
      const messes = Array.isArray(data) ? data : [];
      return messes.sort((left, right) =>
        compareNaturalText(left.hall_name || left.name, right.hall_name || right.name)
      );
    },
  });
};
