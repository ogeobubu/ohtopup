import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { getWallet, getServiceID, getUser } from '../../../api';
import Modal from '../../../admin/components/modal';
import ConfirmationModal  from './components/ConfirmationModal';
import NetworkProviderSelector from './components/NetworkProviderSelector';
import DataPlanSelector from './components/DataPlanSelector';
import PhoneNumberInput from './components/PhoneNumberInput';
import TransactionSummary from './components/TransactionSummary';
import useDataVariations from './hooks/useDataVariations';
import useDataPurchase from './hooks/useDataPurchase';
import { formatNairaAmount, formatPhoneNumber } from '../../../utils';

const DataPurchase = ({ isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [queryId, setQueryId] = useState(null);

  const { data: identifers } = useQuery({
    queryKey: ['identifers', 'data'],
    queryFn: () => getServiceID('data'),
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  const { data: options } = useDataVariations(queryId);

  useEffect(() => {
    setIsModalOpen(true)
  }, [])
 

  const validationSchema = Yup.object().shape({
    phoneNumber: Yup.string()
      .required('Phone number is required')
      .test('is-valid', 'Please enter a valid Nigerian phone number', (value) => {
        return value && value.startsWith('+234') && value.length === 14;
      }),
    amount: Yup.number()
      .required('Amount is required')
      .min(50, 'Minimum purchase amount is ₦50')
      .max(
        walletData?.balance,
        `Your wallet balance (${formatNairaAmount(walletData?.balance)}) is insufficient`
      ),
    provider: Yup.string().required('Please select a provider'),
    source: Yup.string().required('Please select a data plan'),
  });

  const initialValues = {
    phoneNumber: user?.phoneNumber ? `+234${user.phoneNumber.replace(/^0/, '')}` : '',
    amount: '',
    provider: '',
    source: '',
  };

  const handleSubmit = (values) => {
    const selectedPlan = options?.find(opt => opt.value === values.source);
    setTransactionDetails({
      provider: values.provider,
      providerName: values.provider.split('-')[0].toUpperCase(),
      phoneNumber: values.phoneNumber,
      planName: selectedPlan?.label || 'Data Plan',
      variation_code: values.source,
      amount: Number(values.amount),
    });
    setIsConfirmationOpen(true);
  };

  const { mutateAsync, isLoading: isSubmitting } = useDataPurchase(() => {
    setIsModalOpen(false);
    setIsConfirmationOpen(false);
  });
  
  const [isConfirming, setIsConfirming] = useState(false);
  
  const confirmPurchase = async () => {
    try {
      setIsConfirming(true);
      await mutateAsync({
        serviceID: transactionDetails.provider,
        billersCode: formatPhoneNumber(transactionDetails.phoneNumber),
        variation_code: transactionDetails.variation_code,
        amount: transactionDetails.amount,
        phone: formatPhoneNumber(user?.phoneNumber),
      });
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 h-full flex flex-col items-center justify-center">
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
      >
        Buy Data
      </button>

      <Modal isDarkMode={isDarkMode} isOpen={isModalOpen} closeModal={() => setIsModalOpen(false)} title="Data Purchase">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="flex flex-col space-y-4">
              <NetworkProviderSelector
                providers={identifers}
                selectedProvider={values.provider}
                onChange={(provider) => {
                  setQueryId(provider);
                  setFieldValue('provider', provider);
                  setFieldValue('source', '');
                  setFieldValue('amount', '');
                }}
                isSubmitting={isSubmitting}
              />

              {values.provider && (
                <>
                  <DataPlanSelector
                    providerId={values.provider}
                    isDarkMode={isDarkMode}
                    onChange={(selectedOption) => {
                      setFieldValue('source', selectedOption.value);
                      setFieldValue('amount', selectedOption.amount);
                    }}
                    value={options?.find(opt => opt.value === values.source)}
                  />

                  <PhoneNumberInput
                    name="phoneNumber"
                    isDarkMode={isDarkMode}
                    disabled={isSubmitting}
                  />

                  <TransactionSummary
                    amount={values.amount}
                    walletBalance={walletData?.balance}
                    isDarkMode={isDarkMode}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !options || !values.source}
                    className="relative mt-4 py-3 font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-400"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="opacity-0">Proceed to Payment</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        </div>
                      </>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </button>
                </>
              )}
            </Form>
          )}
        </Formik>
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

export default DataPurchase;