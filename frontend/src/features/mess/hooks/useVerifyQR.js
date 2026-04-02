import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export const useVerifyQR = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ qr_code, booking_id }) => {
      const payload = {};
      if (qr_code) payload.qr_code = qr_code;
      if (booking_id) payload.booking_id = booking_id;
      const { data } = await api.post('/mess/worker/verify/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'worker', 'scan-history'] });
    },
  });
};
