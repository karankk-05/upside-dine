import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  CROWD_DEMO_REFRESH_MS,
  getDemoLiveCrowdDensity,
  isCrowdDemoEnabled,
} from '../demo/crowdDemo';

/**
 * Fetches live crowd density for a specific mess.
 * Polls every 5 seconds as a fallback for WebSocket.
 *
 * Response shape:
 * { mess_id, person_count, density_percentage, density_level, estimated_wait_minutes, timestamp, feed_url }
 */
export function useLiveCrowdDensity(messId, options = {}) {
  const demoModeEnabled = isCrowdDemoEnabled();

  return useQuery({
    queryKey: ['crowd', 'live', messId, demoModeEnabled ? 'demo' : 'api'],
    queryFn: async () => {
      if (demoModeEnabled) {
        return getDemoLiveCrowdDensity(messId);
      }

      const token = localStorage.getItem('access_token');
      const { data } = await axios.get(`/api/crowd/mess/${messId}/live/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return data;
    },
    enabled: !!messId,
    refetchInterval: (query) => {
      if (demoModeEnabled) {
        return CROWD_DEMO_REFRESH_MS;
      }
      return (query?.state?.error || query?.error) ? 60000 : 5000;
    },
    refetchIntervalInBackground: demoModeEnabled,
    retry: false,
    staleTime: demoModeEnabled ? 0 : 3000,
    ...options,
  });
}

export default useLiveCrowdDensity;
