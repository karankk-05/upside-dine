import { useMutation } from "@tanstack/react-query";
import { api } from "../../../api/axios";

export const useCreatePayment = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/payments/create/", data);
      return res.data;
    },
  });
};