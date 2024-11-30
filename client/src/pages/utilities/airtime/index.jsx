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

const formatPhoneNumber = (phoneNumber) => {
  return phoneNumber.replace(/^\+234/, "0");
};

const Airtime = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [identifier, setIdentifier] = useState("airtime");
  const [isSubmitting, setIsSubmitting] = useState(false); // Local loading state

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
    queryFn: () => (identifier ? getServiceID(identifier) : Promise.resolve([])),
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
      .min(100, "Amount must be at least ₦100") // Minimum amount set to ₦100
      .max(
        walletData?.balance,
        `Your wallet balance (₦${walletData?.balance?.toFixed(0)}) is insufficient for this transaction`
      ),
    provider: Yup.string().required("Please select a provider"),
  });

  const handleSubmit = (values) => {
    setIsSubmitting(true); // Set the local loading state to true
    mutation.mutate(
      {
        serviceID: values.provider,
        amount: values.amount,
        phone: formatPhoneNumber(values.phoneNumber),
      },
      {
        onSettled: () => {
          setIsSubmitting(false); // Reset the loading state regardless of success or error
        },
      }
    );
  };

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 h-full flex justify-center items-center">
      <Modal
        isOpen={isModalOpen}
        closeModal={closeModal}
        title="Airtime Purchase"
      >
        {identifiersError ? (
          <p className="text-center text-xl text-gray-500">
            A problem occurred or service is currently unavailable. Try again later!
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
                        onChange={(value) => form.setFieldValue(field.name, value)}
                        className={`w-full p-2 border rounded bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                  <label className={`mb-1 block text-gray-500`}>
                    Amount
                  </label>
                  <Field name="amount">
                    {({ field, form }) => (
                      <TextField
                        {...field}
                        type="number"
                        value={field.value}
                        className="w-full p-2 border rounded bg-gray-50 text-gray-900"
                        onChange={(e) => {
                          const value = e.target.value === "" ? "" : parseFloat(e.target.value);
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

                <div className="bg-[#F7F9FB] rounded-md p-4 w-full max-w-md">
                  <div className="flex justify-between items-center">
                    <h2 className="text-gray-700">Total</h2>
                    <p className="text-gray-800">₦{formik.values.amount || 0}</p>
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting || walletLoading || identifiersLoading}>
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