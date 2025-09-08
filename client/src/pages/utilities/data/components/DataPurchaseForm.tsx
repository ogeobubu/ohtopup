import React from 'react';
import { Formik, Form } from 'formik';
import NetworkProviderSelector from './NetworkProviderSelector';
import DataPlanSelector from './DataPlanSelector';
import PhoneNumberInput from './PhoneNumberInput';
import TransactionSummary from './TransactionSummary';

const Loader = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const DataPurchaseForm = ({
  identifers,
  isSubmitting,
  isDarkMode,
  walletData,
  onSubmit,
  setQueryId,
  options
}) => {
  const initialValues = {
    phoneNumber: '',
    amount: '',
    provider: '',
    source: '',
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
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
                      <Loader />
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
  );
};

export default DataPurchaseForm;