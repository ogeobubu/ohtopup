import { useMutation } from '@tanstack/react-query';
import { purchaseAirtime } from '../../../../api';
import { toast } from 'react-toastify';

const useAirtimePurchase = (onSuccess) => {
  return useMutation({
    mutationFn: purchaseAirtime,
    onSuccess: (data) => {
      if (data.transaction?.status === 'delivered') toast.success(data.message || 'Purchase successful');
      else toast.info(data.message || 'Purchase is being checked. Please do not buy again yet.');
      onSuccess?.();
    },

    onError: () => {}
  });
};

export default useAirtimePurchase;