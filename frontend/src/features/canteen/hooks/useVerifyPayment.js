import { useMutation } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/payments/verify/", data);
      return res.data;
    },
  });
};