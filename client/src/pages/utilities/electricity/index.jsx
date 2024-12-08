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
  purchaseElectricity,
  getServiceIDElectricity,
  getDataVariationTVCodes,
  getElectricityName,
} from "../../../api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import Select from "react-select";

const formatPhoneNumber = (phoneNumber) => {
  return phoneNumber.replace(/^\+234/, "0");
};

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

const Electricity = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

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
  const [identifier, setIdentifier] = useState("electricity-bill");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [changeBouquet, setChangeBouquet] = useState(false);
  const [meterType, setMeterType] = useState("");

  const {
    data: variations,
    error: variationsError,
    isLoading: variationsLoading,
  } = useQuery({
    queryKey: ["variations", queryId],
    queryFn: () =>
      queryId ? getDataVariationTVCodes(queryId) : Promise.resolve([]),
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
      identifier ? getServiceIDElectricity(identifier) : Promise.resolve([]),
    enabled: !!identifier,
  });

  const optionsDisco = identifers?.map((identifier) => {
    return {
      value: identifier.serviceID,
      label: identifier.name,
    };
  });

  const {
    data: accountNameApi,
    error: accountNameError,
    isLoading: accountNameLoading,
  } = useQuery({
    queryKey: ["accountName", accountNumber, queryId, meterType],
    queryFn: () =>
      accountNumber && queryId && meterType
        ? getElectricityName(queryId, accountNumber, meterType)
        : Promise.resolve([]),
    enabled: !!accountNumber && !!queryId && !!meterType,
  });

  const mutation = useMutation({
    mutationFn: purchaseElectricity,
    onSuccess: () => {
      toast.success("Transaction successful!");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || "Transaction failed. Please try again.");
    },
  });

  const validationSchema = Yup.object().shape({
    phoneNumber: Yup.string().required("Phone number is required"),
    amount: Yup.number()
      .required("Amount is required")
      .min(1000, "Amount must be at least ₦1000")
      .max(
        walletData?.balance,
        `Your wallet balance (₦${walletData?.balance?.toFixed(
          0
        )}) is insufficient for this transaction`
      ),
    provider: Yup.string().required("Please select a provider"),
    accountNumber: Yup.string().required("Please put in your meter number"),
    meterType: Yup.string().required("Please choose your meter type"),
  });

  const isLoading = identifersLoading;

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
        title="Electricity Bill"
      >
        {isLoading ? (
          <div className="text-center text-xl text-gray-500">
            Loading data, please wait...
          </div>
        ) : identifersError ? (
          <p className="text-center text-xl text-gray-500">
            A problem occurred or service is currently unavailabe. Try again
            later!
          </p>
        ) : (
          <Formik
            initialValues={{
              amount: "",
              provider: "",
              accountNumber: "",
              meterType: "",
              phoneNumber: "",
            }}
            validationSchema={validationSchema}
            onSubmit={(values) => {
              mutation.mutate({
                serviceID: values.provider,
                billersCode: values.accountNumber,
                variation_code: values.meterType,
                amount: values.amount,
                phone: formatPhoneNumber(values.phoneNumber),
              });
            }}
          >
            {(formik) => {
              const handleProviderChange = (provider) => {
                setQueryId(provider.value);
                formik.setFieldValue("provider", provider.value);
                formik.setFieldValue("accountNumber", "");
                formik.setFieldValue("meterType", "");
                formik.setFieldValue("amount", "");
                setAccountNumber("");
                setMeterType("");
              };
              const verifyAccountName = (value) => {
                if (value.length > 12) {
                  setAccountNumber(value);
                }
              };

              return (
                <Form className="flex flex-col">
                  <div className="flex flex-col">
                    <div>
                      <label className="block text-gray-500 mb-2">Disco</label>
                      <Select
                        styles={customStyles}
                        options={optionsDisco}
                        onChange={handleProviderChange}
                        placeholder="Select an option"
                        classNamePrefix="select"
                      />
                      <ErrorMessage
                        name="provider"
                        component="div"
                        className="text-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="my-3 bg-gray-100 rounded-md p-2">
                      <label className="block text-gray-500 mb-2">
                        Meter Type
                      </label>
                      <div className="flex items-center">
                        <Field
                          type="radio"
                          name="meterType"
                          value="prepaid"
                          id="prepaid"
                          className="h-5 w-5 text-blue-600"
                          onChange={() => {
                            formik.setFieldValue("meterType", "prepaid");
                            setMeterType("prepaid");
                          }}
                        />
                        <label
                          htmlFor="prepaid"
                          className="ml-2 text-gray-700 text-lg"
                        >
                          Prepaid Meter
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="radio"
                          name="meterType"
                          value="postpaid"
                          id="postpaid"
                          className="h-5 w-5 text-blue-600"
                          onChange={() => {
                            formik.setFieldValue("meterType", "postpaid");
                            setMeterType("postpaid");
                          }}
                        />
                        <label
                          htmlFor="postpaid"
                          className="ml-2 text-gray-700 text-lg"
                        >
                          Postpaid Meter
                        </label>
                      </div>
                    </div>

                    <ErrorMessage
                      name="meterType"
                      component="div"
                      className="text-red-500 text-sm mt-2"
                    />
                  </div>
                  <div className="flex flex-col mt-3">
                    <label className={`block text-gray-500`}>
                      Meter Number
                    </label>
                    <Field name="accountNumber">
                      {({ field, form }) => (
                        <TextField
                          {...field}
                          type="text"
                          value={field.value}
                          className="w-full border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                          onChange={(e) => {
                            form.setFieldValue(field.name, e.target.value);
                            verifyAccountName(e.target.value);
                          }}
                        />
                      )}
                    </Field>
                    <ErrorMessage
                      name="accountNumber"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  {accountNameApi && (
                    <>
                      <div className="flex flex-col">
                        <label className={`mb-1 block text-gray-500`}>
                          Meter Card Name
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
                    </>
                  )}

                  <div className="flex flex-col">
                    <label className={`mb-1 block text-gray-500`}>Amount</label>
                    <Field name="amount">
                      {({ field, form }) => (
                        <TextField
                          {...field}
                          type="text"
                          value={formik.values.amount}
                          className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                          onChange={(e) => {
                            form.setFieldValue(field.name, e.target.value);
                          }}
                        />
                      )}
                    </Field>
                  </div>
                  <div className="flex flex-col mb-3">
                    <label className={`mb-1 block text-gray-500 mb-2`}>
                      Phone Number
                    </label>
                    <Field name="phoneNumber">
                      {({ field, form }) => (
                        <PhoneInput
                          {...field}
                          international
                          defaultCountry="NG"
                          value={field.value}
                          onChange={(value) =>
                            form.setFieldValue(field.name, value)
                          }
                          className={`w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                          placeholder="Enter phone number"
                        />
                      )}
                    </Field>
                    <ErrorMessage
                      name="phoneNumber"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div className="bg-[#F7F9FB] rounded-md p-4 w-full max-w-md mb-3">
                    <div className="flex justify-between items-center">
                      <h2 className="text-gray-700">Total</h2>
                      <p className="text-gray-800">
                        ₦{formik.values.amount || 0}
                      </p>
                    </div>
                  </div>
                  <ErrorMessage
                    name="amount"
                    component="div"
                    className="text-red-500"
                  />
                  <br />
                  <Button disabled={mutation.isLoading} type="submit">
                    Pay
                  </Button>
                </Form>
              );
            }}
          </Formik>
        )}
      </Modal>
    </div>
  );
};

export default Electricity;
