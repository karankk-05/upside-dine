import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

/**
 * Fetches live crowd density for a specific mess.
 * Polls every 5 seconds as a fallback for WebSocket.
 *
 * Response shape:
 * { mess_id, person_count, density_percentage, density_level, estimated_wait_minutes, timestamp, feed_url }
 */
export function useLiveCrowdDensity(messId, options = {}) {
  return useQuery({
    queryKey: ['crowd', 'live', messId],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const { data } = await axios.get(`/api/crowd/mess/${messId}/live/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return data;
    },
    enabled: !!messId,
    refetchInterval: 5000,
    retry: 1,
    staleTime: 3000,
    ...options,
  });
}

export default useLiveCrowdDensity;
