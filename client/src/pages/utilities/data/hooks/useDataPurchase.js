import { useMutation } from '@tanstack/react-query';
import { purchaseData } from '../../../../api';
import { toast } from 'react-toastify';

const useDataPurchase = (onSuccess) => {
    return useMutation({
        mutationFn: purchaseData,
    onSuccess: (data) => {
      if (data.transaction?.status === 'delivered') toast.success(data.message || 'Purchase successful');
      else toast.info(data.message || 'Purchase is being checked. Please do not buy again yet.');
      onSuccess?.();
    },

        onError: (error) => {
            toast.error(error.message || "Unable to confirm the purchase. Check your transaction history before trying again.");
        }
    });
};

export default useDataPurchase;