import { useMutation } from '@tanstack/react-query';
import { purchaseAirtime } from '../../../../api';
import { toast } from 'react-toastify';

const useAirtimePurchase = (onSuccess) => {
  return useMutation({
    mutationFn: purchaseAirtime,
    onSuccess: () => {
      toast.success("Airtime purchase successful!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Transaction failed. Please try again.");
    }
  });
};

export default useAirtimePurchase;