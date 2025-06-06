import React, { useState, useEffect } from "react";
import Modal from "../../../admin/components/modal";
import mtn from "../../../assets/mtn.svg";
import glo from "../../../assets/glo.svg";
import airtel from "../../../assets/airtel.svg";
import nineMobile from "../../../assets/9mobile.svg";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import TextField from "../../../components/ui/forms/input";
import Button from "../../../components/ui/forms/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getWallet,
  purchaseCable,
  getServiceID,
  getDataVariationCodes,
  getCableName,
} from "../../../api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import Select from "react-select";
import { formatNairaAmount } from "../../../utils"

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderColor: "#d1d5db",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    backgroundColor: "#f9fafb",
    padding: "0.3rem",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#e0f2fe" : "#ffffff",
    color: "#111827",
    padding: "0.5rem 1rem",
    "&:active": {
      backgroundColor: "#bfdbfe",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#111827",
  }),
};

const formatPhoneNumber = (phoneNumber) => {
  return phoneNumber.replace(/^\+234/, "0");
};

const Cable = ({ user, isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  const {
    data: walletData,
    error: walletError,
    isLoading: walletLoading,
  } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });

  const [queryId, setQueryId] = useState(null);
  const [identifier, setIdentifier] = useState("tv-subscription");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [changeBouquet, setChangeBouquet] = useState(false);

  const {
    data: variations,
    error: variationsError,
    isLoading: variationsLoading,
  } = useQuery({
    queryKey: ["variations", queryId],
    queryFn: () =>
      queryId ? getDataVariationCodes(queryId) : Promise.resolve([]),
    enabled: !!queryId,
  });

  const options = variations?.map((variation) => {
    return {
      value: variation.variation_code,
      label: variation.name,
      amount: variation.variation_amount,
    };
  });

  const {
    data: identifers,
    error: identifersError,
    isLoading: identifersLoading,
  } = useQuery({
    queryKey: ["identifers", identifier],
    queryFn: () =>
      identifier ? getServiceID(identifier) : Promise.resolve([]),
    enabled: !!identifier,
  });

  const {
    data: accountNameApi,
    error: accountNameError,
    isLoading: accountNameLoading,
    isFetching: accountNameFetching,
  } = useQuery({
    queryKey: ["accountName", accountNumber, queryId],
    queryFn: () =>
      accountNumber && queryId
        ? getCableName(queryId, accountNumber)
        : Promise.resolve([]),
    enabled: !!accountNumber && !!queryId,
  });

  const mutation = useMutation({
    mutationFn: purchaseCable,
    onSuccess: () => {
      toast.success("Transaction successful!");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || "Transaction failed. Please try again.");
      setIsSubmitting(false);
    },
  });

  const validationSchema = Yup.object().shape({
    phoneNumber: Yup.string().required("Phone number is required"),
    amount: Yup.number()
      .required("Amount is required")
      .min(0, "Amount must be at least ₦0")
      .max(
        walletData?.balance,
        `Your wallet balance (₦${walletData?.balance?.toFixed(
          0
        )}) is insufficient for this transaction`
      ),
    provider: Yup.string().required("Please select a provider"),
    source: Yup.string().required("Please select a data plan"),
  });

  const handleSubmit = async (values) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const code = accountNameApi?.data.Current_Bouquet_Code;
    const test = code?.split(",")[0];
    let data = null;
    if (!changeBouquet) {
      data = {
        serviceID: values.provider,
        billersCode: values.accountNumber,
        amount: accountNameApi?.data?.Renewal_Amount?.toString(),
        phone: formatPhoneNumber(values.phoneNumber),
        subscription_type: "renew",
      };
    } else {
      data = {
        serviceID: values.provider,
        billersCode: values.accountNumber,
        amount: values.amount,
        phone: formatPhoneNumber(values.phoneNumber),
        variation_code: values.source,
        subscription_type: "change",
      };
    }
    mutation.mutate(data);
  };

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 h-full flex flex-col items-center justify-center">
      <div className="relative">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center bg-blue-500 text-white font-semibold py-2 px-4 rounded-full"
        >
          <span className="animate-bounce">Click to Open Modal</span>
        </button>
      </div>
      <Modal
        isOpen={isModalOpen}
        closeModal={closeModal}
        title="Cable Purchase"
        isDarkMode={isDarkMode}
      >
        {identifersLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : identifersError ? (
          <p className="text-center text-xl text-gray-500">
            A problem occurred or service is currently unavailable. Try again later!
          </p>
        ) : (
          <Formik
            initialValues={{
              phoneNumber: "", 
              amount: "", 
              provider: "",
              source: "",
              accountNumber: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {(formik) => {
              const handleProviderChange = (provider) => {
                setQueryId(provider);
                formik.setFieldValue("provider", provider);
              };

              const handleDataPlanChange = (selectedOption) => {
                formik.setFieldValue("source", selectedOption.value);
                formik.setFieldValue("amount", selectedOption.amount);
              };

              const verifyAccountName = (value) => {
                setAccountNumber(value);
              };

              return (
                <Form className="flex flex-col">
                  <div className="flex flex-col">
                    <label className={`text-[#6d7a98] ${isDarkMode ? 'text-gray-300' : 'text-black'}`} htmlFor="provider">
                      Select Network Provider
                    </label>
                    {identifersLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <div className="flex justify-evenly space-x-4 border border-solid border-gray-300 py-2 dark:border-gray-600">
                        {identifers?.map((provider) => (
                          <button
                            key={provider.serviceID}
                            type="button"
                            className={`flex justify-center items-center rounded-full h-9 w-9 ${
                              formik.values.provider === provider.serviceID
                                ? "border-2 border-blue-500"
                                : "border-0"
                            }`}
                            onClick={() =>
                              handleProviderChange(provider.serviceID)
                            }
                            disabled={isSubmitting}
                          >
                            <img
                              src={provider?.image}
                              alt={provider.serviceID}
                              className="h-8 w-8 rounded-full"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    <ErrorMessage
                      name="provider"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  {formik.values.provider && (
                    <>
                      <div className="flex flex-col mt-3">
                        <label className={`block text-gray-500 dark:text-gray-300`}>
                          Smart Card Number
                        </label>
                        <Field name="accountNumber">
                          {({ field, form }) => (
                            <div className="relative">
                              <TextField
                                {...field}
                                type="text"
                                value={field.value || ""}
                                className="w-full border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                                onChange={(e) => {
                                  form.setFieldValue(field.name, e.target.value);
                                  verifyAccountName(e.target.value);
                                }}
                                disabled={isSubmitting}
                              />
                              {accountNameFetching && (
                                <div className="absolute right-3 top-3">
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </Field>
                        <ErrorMessage
                          name="accountNumber"
                          component="div"
                          className="text-red-500 text-sm"
                        />
                      </div>
                      {accountNameLoading ? (
                        <div className="space-y-3 my-3">
                          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      ) : accountNameApi && (
                        <>
                          <div className="flex flex-col">
                            <label className={`mb-1 block text-gray-500 dark:text-gray-300`}>
                              Smart Card Name
                            </label>
                            <Field name="accountName">
                              {({ field, form }) => (
                                <TextField
                                  {...field}
                                  type="text"
                                  disabled
                                  value={accountNameApi?.data.Customer_Name}
                                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                                />
                              )}
                            </Field>
                          </div>
                          <div className="flex flex-col">
                            <label className={`mb-1 block text-gray-500 dark:text-gray-300`}>
                              Current Bouquet
                            </label>
                            <Field name="accountName">
                              {({ field, form }) => (
                                <TextField
                                  {...field}
                                  type="text"
                                  disabled
                                  value={accountNameApi?.data.Current_Bouquet}
                                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                                />
                              )}
                            </Field>
                          </div>
                          <button
                          type="button"
                            onClick={() => setChangeBouquet((prev) => !prev)}
                            className="ml-auto cursor-pointer text-blue-500 dark:text-blue-400"
                            disabled={isSubmitting}
                          >
                            {!changeBouquet ? "Change package" : "Renew current package"}
                          </button>
                        </>
                      )}
                      {changeBouquet && (
                        <div>
                          <label className="block text-gray-500 mb-2 dark:text-gray-300">
                            Package Plan
                          </label>
                          {variationsLoading ? (
                            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <Select
                              options={options}
                              onChange={handleDataPlanChange}
                              placeholder="Select an option"
                              classNamePrefix="select"
                              isDisabled={isSubmitting}
                              styles={{
                                ...customStyles,
                                control: (base) => ({
                                  ...base,
                                  backgroundColor: isDarkMode ? '#2d3748' : '#f7fafc',
                                  borderColor: isDarkMode ? '#4a5568' : '#cbd5e0',
                                  color: isDarkMode ? '#e2e8f0' : '#4a5568',
                                  '&:hover': {
                                    borderColor: isDarkMode ? '#cbd5e0' : '#a0aec0',
                                  },
                                }),
                                singleValue: (base) => ({
                                  ...base,
                                  color: isDarkMode ? '#e2e8f0' : '#4a5568',
                                }),
                                option: (base, state) => ({
                                  ...base,
                                  backgroundColor: state.isFocused ? (isDarkMode ? '#4a5568' : '#edf2f7') : (isDarkMode ? '#2d3748' : '#ffffff'),
                                  color: isDarkMode ? '#e2e8f0' : '#4a5568',
                                }),
                              }}
                            />
                          )}
                          <ErrorMessage
                            name="source"
                            component="div"
                            className="text-red-500"
                          />
                        </div>
                      )}
                      {!changeBouquet && (
                        <div className="flex flex-col mt-3">
                          <label className={`mb-1 block text-gray-500 dark:text-gray-300`}>
                            Amount
                          </label>
                          <Field name="amount">
                            {({ field, form }) => (
                              <TextField
                                {...field}
                                type="text"
                                disabled
                                value={formatNairaAmount(accountNameApi?.data.Renewal_Amount)}
                                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                                onChange={(e) => {
                                  form.setFieldValue(
                                    field.name,
                                    (accountNameApi?.data.Renewal_Amount).toString()
                                  );
                                }}
                              />
                            )}
                          </Field>
                        </div>
                      )}
                      <div className="flex flex-col my-3">
                        <label className={`mb-1 block text-gray-500 dark:text-gray-300 mb-2`}>
                          Phone Number
                        </label>
                        <Field name="phoneNumber">
                          {({ field, form }) => (
                            <PhoneInput
                              {...field}
                              international
                              defaultCountry="NG"
                              value={field.value || ""}
                              onChange={(value) =>
                                form.setFieldValue(field.name, value)
                              }
                              className={`w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                              placeholder="Enter phone number"
                              disabled={isSubmitting}
                            />
                          )}
                        </Field>
                        <ErrorMessage
                          name="phoneNumber"
                          component="div"
                          className="text-red-500 text-sm"
                        />
                      </div>

                      <div className="bg-[#F7F9FB] dark:bg-gray-700 rounded-md p-4 w-full max-w-md mb-3">
                        <div className="flex justify-between items-center">
                          <h2 className="text-gray-700 dark:text-white">Total</h2>
                          <p className="text-gray-800 dark:text-white">
                            {!changeBouquet
                              ? formatNairaAmount(accountNameApi?.data.Renewal_Amount)
                              : formatNairaAmount(formik.values.amount) || 0}
                          </p>
                        </div>
                      </div>
                      <ErrorMessage
                        name="amount"
                        component="div"
                        className="text-red-500"
                      />
                    </>
                  )}
                  {formik.values.provider && (
                    <div className="mt-3">
                      {changeBouquet ? (
                        <Button 
                          type="submit" 
                          disabled={isSubmitting || !formik.isValid}
                          className="relative"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="opacity-0">Pay Now</span>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                              </div>
                            </>
                          ) : "Pay Now"}
                        </Button>
                      ) : (
                        accountNameApi && (
                          <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="relative"
                          >
                            {isSubmitting ? (
                              <>
                                <span className="opacity-0">Renew Payment</span>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                </div>
                              </>
                            ) : "Renew Payment"}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </Form>
              );
            }}
          </Formik>
        )}
      </Modal>
    </div>
  );
};

export default Cable;