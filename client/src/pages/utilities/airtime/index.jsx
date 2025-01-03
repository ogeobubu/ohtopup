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
import { getWallet, purchaseAirtime, getServiceID } from "../../../api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { formatNairaAmount } from "../../../utils";

const formatPhoneNumber = (phoneNumber) => {
  return phoneNumber.replace(/^\+234/, "0");
};

const Airtime = ({ isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [identifier, setIdentifier] = useState("airtime");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  const {
    data: identifiers,
    error: identifiersError,
    isLoading: identifiersLoading,
  } = useQuery({
    queryKey: ["identifiers", identifier],
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

  const mutation = useMutation({
    mutationFn: purchaseAirtime,
    onSuccess: () => {
      toast.success("Transaction successful!");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || "Transaction failed. Please try again.");
    },
  });

  const validationSchema = Yup.object().shape({
    amount: Yup.number()
      .required("Amount is required")
      .min(50, "Amount must be at least ₦50")
      .max(
        walletData?.balance,
        `Your wallet balance (₦${walletData?.balance?.toFixed(
          0
        )}) is insufficient for this transaction`
      ),
    provider: Yup.string().required("Please select a provider"),
  });

  const handleSubmit = (values) => {
    setIsSubmitting(true);
    mutation.mutate(
      {
        serviceID: values.provider,
        amount: values.amount,
        phone: formatPhoneNumber(values.phoneNumber),
      },
      {
        onSettled: () => {
          setIsSubmitting(false);
        },
      }
    );
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
        title="Airtime Purchase"
        isDarkMode={isDarkMode}
      >
        {identifiersError ? (
          <p className="text-center text-xl text-gray-500">
            A problem occurred or service is currently unavailable. Try again
            later!
          </p>
        ) : (
          <Formik
            initialValues={{
              phoneNumber: "",
              amount: "",
              provider: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {(formik) => (
              <Form className="flex flex-col space-y-3">
                <div className="flex flex-col">
                  <label className="text-[#6d7a98]" htmlFor="provider">
                    Select Network Provider
                  </label>
                  <div className="flex justify-evenly space-x-4 border border-solid border-gray-300 py-2">
                    {identifiers?.map((provider) => (
                      <button
                        title={provider?.serviceID}
                        key={provider?.serviceID}
                        type="button"
                        className={`flex justify-center items-center rounded-full h-9 w-9 ${
                          formik.values.provider === provider?.serviceID
                            ? "border-2 border-blue-500"
                            : "border-0"
                        }`}
                        onClick={() =>
                          formik.setFieldValue("provider", provider?.serviceID)
                        }
                      >
                        <img
                          src={
                            provider?.serviceID === "mtn"
                              ? mtn
                              : provider?.serviceID === "glo"
                              ? glo
                              : provider?.serviceID === "airtel"
                              ? airtel
                              : provider?.serviceID === "etisalat"
                              ? nineMobile
                              : provider?.image
                          }
                          alt={provider?.serviceID}
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

                <div className="flex flex-col">
                  <label className={`mb-1 block text-gray-500`}>
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
                        className={`w-full p-2 border rounded bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600`}
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

                <div className="flex flex-col">
                  <label className={`mb-1 block text-gray-500`}>Amount</label>
                  <Field name="amount">
                    {({ field, form }) => (
                      <TextField
                        {...field}
                        type="number"
                        value={field.value}
                        className="w-full p-2 border rounded bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value);
                          form.setFieldValue(field.name, value);
                        }}
                      />
                    )}
                  </Field>
                  <ErrorMessage
                    name="amount"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div
                  className={`bg-[#F7F9FB] dark:bg-gray-800 rounded-md p-4 w-full max-w-md`}
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-gray-700 dark:text-gray-300">Total</h2>
                    <p className="text-gray-800 dark:text-gray-200">
                      {formatNairaAmount(formik.values.amount) || 0}
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || walletLoading || identifiersLoading}
                >
                  {isSubmitting ? "Processing..." : "Pay Now"}
                </Button>
              </Form>
            )}
          </Formik>
        )}
      </Modal>
    </div>
  );
};

export default Airtime;
