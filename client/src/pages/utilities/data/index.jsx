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
  purchaseData,
  getDataVariationCodes,
  getServiceID,
  getUser
} from "../../../api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import Select from "react-select";

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

const Data = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [identifier, setIdentifier] = useState("data");

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

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
    data: walletData,
    error: walletError,
    isLoading: walletLoading,
  } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });

  const {
    data: user,
    error: userError,
    isLoading: userLoading,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const [queryId, setQueryId] = useState(null);

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

  const mutation = useMutation({
    mutationFn: purchaseData,
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

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 h-full flex justify-center items-center">
      <Modal isOpen={isModalOpen} closeModal={closeModal} title="Data Purchase">
        {identifersError ? (
          <p className="text-center text-xl text-gray-500">
            A problem occurred or service is currently unavailabe. Try again
            later!
          </p>
        ) : (
          <Formik
            initialValues={{
              phoneNumber: "",
              amount: "",
              provider: "",
              source: "",
            }}
            validationSchema={validationSchema}
            onSubmit={(values) => {
              const data = {
                serviceID: values.provider,
                billersCode: formatPhoneNumber(values.phoneNumber),
                variation_code: values.source,
                amount: values.amount,
                phone: formatPhoneNumber(user?.phoneNumber),
              };
              mutation.mutate(data);
            }}
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

              return (
                <Form className="flex flex-col space-y-3">
                  <div className="flex flex-col">
                    <label className="text-[#6d7a98]" htmlFor="provider">
                      Select Network Provider
                    </label>
                    <div className="flex justify-evenly flex-wrap space-x-4 border border-solid border-gray-300 py-2">
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
                        >
                          <img
                            src={
                              provider.serviceID === "mtn-data"
                                ? mtn
                                : provider.serviceID === "glo-data"
                                ? glo
                                : provider.serviceID === "airtel-data"
                                ? airtel
                                : provider.serviceID === "etisalat-data"
                                ? nineMobile
                                : provider.image
                            }
                            alt={provider.serviceID}
                            className="h-8 w-8 object-cover rounded-full"
                          />
                        </button>
                      ))}
                    </div>
                    <ErrorMessage
                      name="provider"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  {formik.values.provider && (
                    <>
                      <div className="mb-4">
                        <label className="block text-gray-500 mb-2">
                          Data Plan
                        </label>
                        <Select
                          styles={customStyles}
                          options={options}
                          onChange={handleDataPlanChange}
                          placeholder="Select an option"
                          classNamePrefix="select"
                        />
                        <ErrorMessage
                          name="source"
                          component="div"
                          className="text-red-500"
                        />
                      </div>
                      <div className="flex flex-col">
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
                      <div className="bg-[#F7F9FB] rounded-md p-4 w-full max-w-md">
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
                    </>
                  )}

                  <Button type="submit" disabled={mutation.isLoading}>
                    {mutation.isLoading ? "Processing..." : "Pay Now"}
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

export default Data;
