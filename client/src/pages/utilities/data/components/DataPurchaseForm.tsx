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
    transactionPin: '',
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

              {/* Transaction PIN Section */}
              <div className="space-y-2">
                <div className="flex flex-col">
                  <label className="mb-2 block text-gray-700 dark:text-gray-300 font-medium">
                    Transaction PIN
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your 4-6 digit PIN"
                    value={values.transactionPin}
                    onChange={(e) => setFieldValue('transactionPin', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-gray-200'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    disabled={isSubmitting}
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter your 4-6 digit transaction PIN to proceed
                  </p>
                </div>
              </div>

              <TransactionSummary
                amount={values.amount}
                walletBalance={walletData?.balance}
                isDarkMode={isDarkMode}
              />

              <button
                type="submit"
                disabled={isSubmitting || !options || !values.source || !values.transactionPin}
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