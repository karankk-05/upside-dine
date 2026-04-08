import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { compareNaturalText } from '../lib/naturalSort';

export const CURRENT_USER_QUERY_KEY = ['current-user'];
export const PUBLIC_HALLS_QUERY_KEY = ['public-halls'];

export const useCurrentUser = (options = {}) =>
  useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/users/me/');
      return data;
    },
    ...options,
  });

export const usePublicHalls = (options = {}) =>
  useQuery({
    queryKey: PUBLIC_HALLS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/public/halls/');
      const halls = Array.isArray(data) ? data : [];
      return halls.sort(compareNaturalText);
    },
    ...options,
  });
