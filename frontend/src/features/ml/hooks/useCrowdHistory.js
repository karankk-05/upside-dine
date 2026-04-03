import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

/**
 * Fetches hourly crowd history for a mess on a given date.
 *
 * Response: array of CrowdMetric objects
 * [{ id, mess_id, density_percentage, estimated_count, density_level, estimated_wait_minutes, recorded_at }]
 */
export function useCrowdHistory(messId, date, options = {}) {
  return useQuery({
    queryKey: ['crowd', 'history', messId, date],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const params = date ? { date } : {};
      const { data } = await axios.get(`/api/crowd/mess/${messId}/history/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
      return data;
    },
    enabled: !!messId,
    staleTime: 60000,
    ...options,
  });
}

export default useCrowdHistory;
