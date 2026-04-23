import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  getDemoCrowdRecommendation,
  isCrowdDemoEnabled,
} from '../demo/crowdDemo';

/**
 * Fetches best-time recommendation for a mess based on 7-day history.
 *
 * Response:
 * { mess_id, recommendation, best_times: [{ hour, time_range, avg_people }] }
 */
export function useCrowdRecommendation(messId, options = {}) {
  const demoModeEnabled = isCrowdDemoEnabled();

  return useQuery({
    queryKey: ['crowd', 'recommendation', messId, demoModeEnabled ? 'demo' : 'api'],
    queryFn: async () => {
      if (demoModeEnabled) {
        return getDemoCrowdRecommendation(messId);
      }

      const token = localStorage.getItem('access_token');
      const { data } = await axios.get(`/api/crowd/mess/${messId}/recommendation/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return data;
    },
    enabled: !!messId,
    staleTime: 300000, // 5 min — recommendations don't change fast
    ...options,
  });
}

export default useCrowdRecommendation;
