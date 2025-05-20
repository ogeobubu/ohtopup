import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getWallet, getServiceID } from "../../../api";
import Modal from "../../../admin/components/modal";
import AirtimeForm from "./components/AirtimeForm";
import ConfirmationModal from "./components/ConfirmationModal";
import useAirtimePurchase from "./hooks/useAirtimePurchase";
import { formatPhoneNumber } from "../../../utils";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

const Loader = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const AirtimePurchase = ({ isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Enhanced query with loading states
  const {
    data: walletData,
    isLoading: isWalletLoading,
    error: walletError,
  } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });

  const {
    data: providers,
    isLoading: isProvidersLoading,
    error: providersError,
  } = useQuery({
    queryKey: ["providers", "airtime"],
    queryFn: () => getServiceID("airtime"),
  });

  const { mutateAsync, isLoading: isSubmitting } = useAirtimePurchase(() => {
    setIsModalOpen(false);
    setIsConfirmationOpen(false);
  });

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  const confirmPurchase = async () => {
    try {
      setIsConfirming(true);
      await mutateAsync({
        serviceID: transactionDetails.provider,
        amount: transactionDetails.amount,
        phone: formatPhoneNumber(transactionDetails.phoneNumber),
      });
    } catch (error) {
    } finally {
      setIsConfirming(false);
    }
  };

  // Loading state for initial data fetch
  if (isWalletLoading || isProvidersLoading) {
    return (
      <div className="border border-solid border-gray-200 rounded-md p-6 h-full flex flex-col items-center justify-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Loading airtime services...
        </p>
      </div>
    );
  }

  // Error state
  if (walletError || providersError) {
    return (
      <div className="border border-solid border-gray-200 rounded-md p-6 h-full flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          {walletError?.message ||
            providersError?.message ||
            "Failed to load airtime services. Please try again later."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 h-full flex flex-col items-center justify-center">
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <LoadingSpinner size="small" className="mr-2" />
            Processing...
          </span>
        ) : (
          "Buy Airtime"
        )}
      </button>

      <Modal
        isDarkMode={isDarkMode}
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        title="Airtime Purchase"
      >
        {isWalletLoading || isProvidersLoading ? (
          <Loader />
        ) : (
          <AirtimeForm
            providers={providers}
            walletBalance={walletData?.balance}
            isDarkMode={isDarkMode}
            onSubmit={(values) => {
              setTransactionDetails({
                ...values,
                providerName: values.provider.toUpperCase(),
              });
              setIsConfirmationOpen(true);
            }}
            isLoading={isSubmitting}
          />
        )}
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={confirmPurchase}
        transactionDetails={transactionDetails}
        isDarkMode={isDarkMode}
        isLoading={isConfirming || isSubmitting}
      />
    </div>
  );
};

export default AirtimePurchase;
