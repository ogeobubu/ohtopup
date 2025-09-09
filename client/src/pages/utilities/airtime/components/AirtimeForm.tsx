import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatNairaAmount } from "../../../../utils";
import { getAirtimeLimits } from "../../../../api";
import NetworkProviderSelector from "./NetworkProviderSelector";
import PhoneNumberInput from "./PhoneNumberInput";
import QuickAmounts from "./QuickAmounts";
import TransactionSummary from "../../data/components/TransactionSummary";

const AirtimeForm = ({ providers, walletBalance, isDarkMode, onSubmit }) => {
  const [detectedNetwork, setDetectedNetwork] = useState(null);

  // Fetch airtime limits from API
  const { data: limitsData, isLoading: limitsLoading } = useQuery({
    queryKey: ['airtimeLimits'],
    queryFn: getAirtimeLimits,
  });

  // Get current limits based on detected network
  const getCurrentLimits = () => {
    if (!limitsData?.limits) {
      return { minAmount: 50, maxAmount: 50000 }; // Default fallback
    }

    const globalLimits = limitsData.limits.global;
    const networkLimits = detectedNetwork && limitsData.limits.networks[detectedNetwork];

    return {
      minAmount: networkLimits?.minAmount || globalLimits.minAmount,
      maxAmount: Math.min(
        networkLimits?.maxAmount || globalLimits.maxAmount,
        walletBalance
      )
    };
  };

  const currentLimits = getCurrentLimits();

  // Generate quick amount options based on current limits
  const generateQuickAmounts = (limits) => {
    const { minAmount, maxAmount } = limits;
    const amounts = [];

    // Generate 4 quick amounts within the limits
    const range = maxAmount - minAmount;
    const step = Math.max(100, Math.floor(range / 4));

    for (let i = 1; i <= 4; i++) {
      const amount = Math.min(minAmount + (step * i), maxAmount);
      if (amount >= minAmount && amount <= maxAmount && !amounts.includes(amount)) {
        amounts.push(amount);
      }
    }

    // If we don't have enough amounts, add some defaults
    if (amounts.length < 4) {
      const defaults = [100, 200, 500, 1000];
      defaults.forEach(amount => {
        if (amount >= minAmount && amount <= maxAmount && !amounts.includes(amount)) {
          amounts.push(amount);
        }
      });
    }

    return amounts.slice(0, 4);
  };

  const validationSchema = Yup.object().shape({
    phoneNumber: Yup.string()
      .required("Phone number is required")
      .test(
        "is-valid",
        "Please enter a valid Nigerian phone number",
        (value) => {
          return value && value.startsWith("+234") && value.length === 14;
        }
      ),
    amount: Yup.number()
      .required("Amount is required")
      .min(currentLimits.minAmount, `Minimum purchase amount is ₦${currentLimits.minAmount}`)
      .max(
        currentLimits.maxAmount,
        currentLimits.maxAmount >= walletBalance
          ? `Your wallet balance (${formatNairaAmount(walletBalance)}) is insufficient`
          : `Maximum purchase amount is ₦${currentLimits.maxAmount}`
      ),
    provider: Yup.string().required("Please select a provider"),
    transactionPin: Yup.string()
      .required("Transaction PIN is required")
      .matches(/^\d{4,6}$/, "Transaction PIN must be 4-6 digits"),
  });

  // Handle network detection from phone number
  const handleNetworkDetected = (network) => {
    setDetectedNetwork(network);
    if (network) {
      console.log(`Detected ${network.toUpperCase()} network`);
    }
  };

  return (
    <Formik
      initialValues={{
        phoneNumber: "",
        amount: "",
        provider: "",
        transactionPin: "",
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue, isSubmitting }) => (
        <Form className="flex flex-col space-y-6">
          {/* Network Provider Section */}
          <div className="space-y-3">
            <NetworkProviderSelector
              providers={providers}
              selectedProvider={values.provider}
              onChange={(provider) => setFieldValue("provider", provider)}
              isSubmitting={isSubmitting}
            />
            {!values.provider && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Please select a network provider
              </p>
            )}
          </div>

          {/* Phone Number Section */}
          <div className="space-y-2">
            <PhoneNumberInput
              name="phoneNumber"
              isDarkMode={isDarkMode}
              disabled={isSubmitting}
              onNetworkDetected={handleNetworkDetected}
            />
          </div>

          {/* Amount Section */}
          <div className="space-y-3">
            <div className="flex flex-col">
              <label className="mb-2 block text-gray-700 dark:text-gray-300 font-medium">
                Amount (₦)
              </label>
              <Field name="amount">
                {({ field, form }) => (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">₦</span>
                    </div>
                    <input
                      {...field}
                      type="number"
                      value={field.value}
                      placeholder="Enter amount"
                      className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg transition-colors ${
                        form.errors.amount && form.touched.amount
                          ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      } text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? "" : parseFloat(e.target.value);
                        form.setFieldValue(field.name, value);
                      }}
                      disabled={isSubmitting}
                      min="50"
                      step="1"
                    />
                  </div>
                )}
              </Field>
              <ErrorMessage
                name="amount"
                component="div"
                className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum amount: ₦{currentLimits.minAmount}
              </p>
            </div>

            <QuickAmounts
              amounts={generateQuickAmounts(currentLimits)}
              selectedAmount={values.amount ? parseFloat(values.amount) : 0}
              onChange={(amount) => setFieldValue("amount", amount.toString())}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Transaction PIN Section */}
          <div className="space-y-2">
            <div className="flex flex-col">
              <label className="mb-2 block text-gray-700 dark:text-gray-300 font-medium">
                Transaction PIN
              </label>
              <Field name="transactionPin">
                {({ field, form }) => (
                  <input
                    {...field}
                    type="password"
                    placeholder="Enter your 4-6 digit PIN"
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                      form.errors.transactionPin && form.touched.transactionPin
                        ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    } text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    disabled={isSubmitting}
                    maxLength={6}
                  />
                )}
              </Field>
              <ErrorMessage
                name="transactionPin"
                component="div"
                className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your 4-6 digit transaction PIN to proceed
              </p>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4">
            <TransactionSummary
              amount={values.amount ? parseFloat(values.amount) : 0}
              walletBalance={walletBalance}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!values.provider || !values.phoneNumber || !values.amount || !values.transactionPin || isSubmitting}
            className={`relative w-full py-4 px-6 font-semibold rounded-xl transition-all duration-200 transform ${
              !values.provider || !values.phoneNumber || !values.amount || !values.transactionPin || isSubmitting
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Proceed to Payment
              </span>
            )}
          </button>
        </Form>
      )}
    </Formik>
  );
};

AirtimeForm.propTypes = {
  providers: PropTypes.array,
  walletBalance: PropTypes.number,
  isDarkMode: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired
};

export default AirtimeForm;
