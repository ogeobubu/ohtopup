import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { formatNairaAmount } from "../../../../utils";
import NetworkProviderSelector from "./NetworkProviderSelector";
import PhoneNumberInput from "../../data/components/PhoneNumberInput";
import QuickAmounts from "./QuickAmounts";
import TransactionSummary from "../../data/components/TransactionSummary";

const AirtimeForm = ({ providers, walletBalance, isDarkMode, onSubmit }) => {
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
      .min(50, "Minimum purchase amount is ₦50")
      .max(
        walletBalance,
        `Your wallet balance (${formatNairaAmount(
          walletBalance
        )}) is insufficient`
      ),
    provider: Yup.string().required("Please select a provider"),
  });

  return (
    <Formik
      initialValues={{
        phoneNumber: "",
        amount: "",
        provider: "",
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue, isSubmitting }) => (
        <Form className="flex flex-col space-y-4">
          <NetworkProviderSelector
            providers={providers}
            selectedProvider={values.provider}
            onChange={(provider) => setFieldValue("provider", provider)}
            isSubmitting={isSubmitting}
          />

          <PhoneNumberInput
            name="phoneNumber"
            isDarkMode={isDarkMode}
            disabled={isSubmitting}
          />

          <div className="flex flex-col">
            <label className="mb-1 block text-gray-500 dark:text-gray-300">
              Amount
            </label>
            <Field name="amount">
              {({ field, form }) => (
                <input
                  {...field}
                  type="number"
                  value={field.value}
                  className={`w-full p-2 border rounded bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                    form.errors.amount && form.touched.amount
                      ? "border-red-500"
                      : ""
                  }`}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? "" : parseFloat(e.target.value);
                    form.setFieldValue(field.name, value);
                  }}
                  disabled={isSubmitting}
                />
              )}
            </Field>
            <ErrorMessage
              name="amount"
              component="div"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          <QuickAmounts
            selectedAmount={values.amount}
            onChange={(amount) => setFieldValue("amount", amount)}
            isSubmitting={isSubmitting}
          />

          <TransactionSummary
            amount={values.amount}
            walletBalance={walletBalance}
            isDarkMode={isDarkMode}
          />

          <button
            type="submit"
            disabled={!values.provider}
            className="relative mt-4 py-3 font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-400"
          >
            Proceed to Payment
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default AirtimeForm;
