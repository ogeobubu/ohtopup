import React, { useState } from "react";
import Select from "react-select";
import TextField from "../../components/ui/forms/input";
import Button from "../../components/ui/forms/button";
import { useFormik } from "formik";
import * as Yup from "yup";
import { withdrawFunds, withdrawFundsAuthorization } from "../../api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const Spinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const Withdraw = ({ handleShowBanks, walletData, user, closeModal, isDarkMode }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [authorizationVisible, setAuthorizationVisible] = useState(false);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectedBank, setSelectedBank] = useState(null);
  const [authCode, setAuthCode] = useState("");

  const bankOptions = user?.bankAccounts?.map((account) => ({
    value: account.accountNumber,
    code: account.bankCode,
    label: `${account.bankName} - ${account.accountNumber}`,
  })) || [];

  const formik = useFormik({
    initialValues: {
      selectedBank: null,
      amount: "",
    },
    validationSchema: Yup.object({
      selectedBank: Yup.object().required("Bank account is required"),
      amount: Yup.number()
        .required("Amount is required")
        .positive("Amount must be positive")
        .min(1000, "Minimum withdrawal amount is NGN 1000")
        .max(walletData?.balance || 0, "Insufficient funds"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { amount, selectedBank } = values;
        setAmount(parseFloat(amount));
        setSelectedBank(selectedBank);
        
        const response = await withdrawFunds({
          name: user?.username,
          amount: parseFloat(amount),
          bankName: selectedBank.label.split(" - ")[0],
          accountNumber: selectedBank.value,
          bankCode: selectedBank.code,
        });
        toast.success("Withdrawal initiated! Please authorize with a code.");
        setReference(response.transaction.reference);
        setAuthorizationVisible(true);
        formik.resetForm();
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleAuthorizationSubmit = async () => {
    setLoading(true);
    try {
      const response = await withdrawFundsAuthorization({
        reference,
        name: user?.username,
        amount: parseFloat(amount),
        bankName: selectedBank.label.split(" - ")[0],
        accountNumber: selectedBank.value,
        bankCode: selectedBank.code,
        authorizationCode: authCode,
      });

      toast.success("Withdrawal successful!");
      await queryClient.invalidateQueries(["wallet"]);
      closeModal();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error) => {
    toast.error("Error: " + error.message);
  };

  const NoBankAccounts = () => (
    <div className="flex flex-col items-center p-2">
      <p className="mb-2 text-gray-500">You don’t have any bank accounts.</p>
      <button
        onClick={() => {
          closeModal();
          handleShowBanks();
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Add a Bank Account
      </button>
    </div>
  );

  return (
    <div className={`space-y-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className={`flex justify-center items-center rounded-sm py-2 ${isDarkMode ? 'bg-gray-700 border border-blue-500' : 'bg-[#F1F4FC] border border-blue-500'}`}>
  <div className="flex flex-col gap-1">
    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Naira Balance</span>
    <div className="flex justify-center items-center">
      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>₦</span>
      <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        {walletData?.balance?.toFixed(2) || "0.00"}
      </span>
    </div>
  </div>
</div>

      {!authorizationVisible ? (
        <>
          <div>
  <label className={`block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
    Select Bank Account
  </label>
  <Select
    options={bankOptions}
    placeholder="Select a bank account..."
    onChange={(option) => formik.setFieldValue("selectedBank", option)}
    className={`mb-4 ${
      formik.touched.selectedBank && formik.errors.selectedBank
        ? "border-red-500"
        : isDarkMode ? 'border-gray-600' : 'border-gray-300'
    }`}
    isClearable
    noOptionsMessage={() => <NoBankAccounts />}
    styles={{
      control: (base) => ({
        ...base,
        backgroundColor: isDarkMode ? '#2d3748' : '#ffffff', // Dark mode background
        borderColor: formik.touched.selectedBank && formik.errors.selectedBank ? 'red' : isDarkMode ? '#4a5568' : '#d1d5db',
        color: isDarkMode ? '#cbd5e0' : '#000000', // Text color
      }),
      placeholder: (base) => ({
        ...base,
        color: isDarkMode ? '#a0aec0' : '#9ca3af', // Placeholder color
      }),
      singleValue: (base) => ({
        ...base,
        color: isDarkMode ? '#cbd5e0' : '#000000', // Selected value color
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: isDarkMode ? '#2d3748' : '#ffffff', // Dropdown menu background
      }),
      option: (base, { isFocused }) => ({
        ...base,
        backgroundColor: isFocused ? (isDarkMode ? '#4a5568' : '#e5f3ff') : (isDarkMode ? '#2d3748' : '#ffffff'), // Option background
        color: isDarkMode ? '#cbd5e0' : '#000000', // Option text color
      }),
    }}
  />
  {formik.touched.selectedBank && formik.errors.selectedBank && (
    <div className="text-red-500 text-sm mb-2">
      {formik.errors.selectedBank.message}
    </div>
  )}
</div>

          <TextField
            label="Amount"
            helperText={`Withdrawal Fee = NGN 0.00`}
            value={formik.values.amount}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="amount"
            error={formik.touched.amount && Boolean(formik.errors.amount)}
            isDarkMode={isDarkMode}
          />
          {formik.touched.amount && formik.errors.amount && (
            <div className="text-red-500 text-sm mb-2">
              {formik.errors.amount.message}
            </div>
          )}

          <Button
            onClick={formik.handleSubmit}
            disabled={loading}
            className={`w-full ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? <Spinner /> : "Withdraw"}
          </Button>
        </>
      ) : (
        <>
          <button className="text-underlined text-blue-500 text-sm" onClick={() => setAuthorizationVisible(false)}>Go back</button>
          <div className="mt-4">
            <TextField
              label="Authorization Code"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              error={authCode.length !== 6}
              helperText="Please enter the 6-digit code."
            />
            <Button
              onClick={handleAuthorizationSubmit}
              disabled={loading || authCode.length !== 6}
              className={`w-full ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? <Spinner /> : "Authorize"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Withdraw;