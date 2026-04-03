import { useMutation } from "@tanstack/react-query";
import api from "../../../lib/api";

export const useCreatePayment = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/payments/create-order/", data);
      return res.data;
    },
  });
};