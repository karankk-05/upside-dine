import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getDemoCrowdHistory, isCrowdDemoEnabled } from '../demo/crowdDemo';

/**
 * Fetches hourly crowd history for a mess on a given date.
 *
 * Response: array of CrowdMetric objects
 * [{ id, mess_id, density_percentage, estimated_count, density_level, estimated_wait_minutes, recorded_at }]
 */
export function useCrowdHistory(messId, date, options = {}) {
  const { demoMode, ...queryOptions } = options;
  const demoModeEnabled = demoMode ?? isCrowdDemoEnabled();

  return useQuery({
    queryKey: ['crowd', 'history', messId, date, demoModeEnabled ? 'demo' : 'api'],
    queryFn: async () => {
      if (demoModeEnabled) {
        return getDemoCrowdHistory(messId, date);
      }

      const token = localStorage.getItem('access_token');
      const params = date ? { date } : {};
      const { data } = await axios.get(`/api/crowd/mess/${messId}/history/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
      return data;
    },
    enabled: !!messId,
    staleTime: demoModeEnabled ? 300000 : 60000,
    ...queryOptions,
  });
}

export default useCrowdHistory;
