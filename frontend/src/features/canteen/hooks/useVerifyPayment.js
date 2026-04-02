import { useMutation } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/payments/verify/", data);
      return res.data;
    },
  });
};