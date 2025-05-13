import { useMutation } from '@tanstack/react-query';
import { purchaseData } from '../../../../api';
import { toast } from 'react-toastify';

const useDataPurchase = (onSuccess) => {
    return useMutation({
        mutationFn: purchaseData,
        onSuccess: (data) => {
            if (data.message === "Transaction pending!") {
                toast.info(`Transaction pending! Request ID: ${data.transaction.requestId}`);
            } else {
                toast.success("Data purchase successful!");
                onSuccess?.();
            }
        },
        onError: (error) => {
            toast.error(error.message || "Transaction failed. Please try again.");
        }
    });
};

export default useDataPurchase;