import React, { useState } from "react";
import Select from "react-select";
import TextField from "../../components/ui/forms/input";
import Button from "../../components/ui/forms/button";
import { useFormik } from "formik";
import * as Yup from "yup";
import { withdrawFunds, verifyBankAccount } from "../../api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";


const Spinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const Withdraw = ({
  handleShowBanks,
  walletData,
  user,
  closeModal,
  isDarkMode,
  rates,
  formatNairaAmount,
  walletSettings,
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedAccountName, setSelectedAccountName] = useState("");
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [withdrawalFee, setWithdrawalFee] = useState(0);
  const [feeDeductionMethod, setFeeDeductionMethod] = useState("fromWallet");

  // Debug logging
  console.log('Withdraw component props:', {
    walletSettings,
    deductFeesFromWithdrawals: walletSettings?.deductFeesFromWithdrawals,
    withdrawalFee: walletSettings?.withdrawalFee
  });

  const bankOptions =
    user?.bankAccounts?.map((account) => ({
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
      amount: Yup.string()
        .required("Amount is required")
        .test("is-valid-amount", "Amount must be a valid number", (value) => {
          if (!value) return false;
          const numValue = parseFloat(value.replace(/,/g, ''));
          return !isNaN(numValue && numValue > 0);
        })
        .test("is-positive", "Amount must be positive", (value) => {
          const numValue = parseFloat(value.replace(/,/g, ''));
          return numValue > 0;
        })
        .test("min-amount", `Minimum withdrawal amount is ₦${walletSettings?.minWithdrawalAmount || 100}`, (value) => {
          const numValue = parseFloat(value.replace(/,/g, ''));
          const minAmount = walletSettings?.minWithdrawalAmount || 100;
          return numValue >= minAmount;
        })
        .test("max-amount", (value) => {
          const numValue = parseFloat(value.replace(/,/g, ''));
          const maxAmount = walletSettings?.maxWithdrawalAmount || 500000;
          const balance = walletData?.balance || 0;

          if (numValue > balance) {
            return `Insufficient funds. Your balance is ₦${balance.toLocaleString()}`;
          }
          if (numValue > maxAmount) {
            return `Maximum withdrawal amount is ₦${maxAmount.toLocaleString()}`;
          }
          return true;
        }),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { amount, selectedBank } = values;

        const withdrawalAmount = parseFloat(amount.replace(/,/g, ''));
        const response = await withdrawFunds({
          name: user?.username,
          amount: withdrawalAmount,
          bankName: selectedBank.label.split(" - ")[0],
          accountNumber: selectedBank.value,
          bankCode: selectedBank.code,
          feeDeductionMethod: feeDeductionMethod,
        });
        toast.success("Withdrawal request submitted successfully! It will be processed after admin approval.");
        await queryClient.invalidateQueries({ queryKey: ["wallet"] });
        formik.resetForm();
        closeModal();
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    const formattedValue = value ? parseFloat(value).toLocaleString() : "";
    formik.setFieldValue("amount", formattedValue);

    // Calculate withdrawal fee if enabled
    if (walletSettings?.deductFeesFromWithdrawals && value) {
      const amount = parseFloat(value);
      if (!isNaN(amount) && amount > 0) {
        // Use admin-set withdrawal fee settings
        const { percentage = 1, fixedFee = 50, cap = 500 } = walletSettings.withdrawalFee || {};
        const percentageFee = amount * (percentage / 100);
        const totalFee = Math.min(cap, fixedFee + percentageFee);
        console.log('Withdrawal fee calculation:', { amount, percentage, fixedFee, cap, percentageFee, totalFee });
        setWithdrawalFee(totalFee);
      } else {
        setWithdrawalFee(0);
      }
    } else {
      console.log('Fee deduction not enabled or no value:', { deductFeesFromWithdrawals: walletSettings?.deductFeesFromWithdrawals, value });
      setWithdrawalFee(0);
    }
  };

  const handleBankAccountChange = async (selectedOption) => {
    formik.setFieldValue("selectedBank", selectedOption);
    setSelectedAccountName("");

    if (selectedOption) {
      setVerifyingAccount(true);
      try {
        const response = await verifyBankAccount({
          accountNumber: selectedOption.value,
          bankCode: selectedOption.code,
        });

        console.log(response.data)

        if (response && response.data && response.data.data) {
          setSelectedAccountName(response.data.data.account_name);
          toast.success("Bank account verified successfully!");
        } else {
          toast.error("Unable to verify bank account. Please try again.");
        }
      } catch (error) {
        console.error("Bank account verification error:", error);

        // Handle Paystack test mode limitations
        if (error.message?.includes("Test mode daily limit") ||
            error.message?.includes("live bank resolves exceeded") ||
            error.status === 429) {
          // For test/development environments, use a fallback approach
          setSelectedAccountName("Account Holder (Test Mode)");
          toast.info("Test mode: Using placeholder account name. In production, this would be verified.");
        } else {
          toast.error("Failed to verify bank account. Please check the account details.");
          setSelectedAccountName("");
        }
      } finally {
        setVerifyingAccount(false);
      }
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

  // Check if maintenance mode is enabled
  if (walletSettings?.maintenanceMode) {
    return (
      <div className={`space-y-3 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
        <div className="text-center p-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isDarkMode ? 'bg-yellow-600' : 'bg-yellow-100'
          }`}>
            <svg className={`w-8 h-8 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Withdrawals Temporarily Unavailable
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {walletSettings.maintenanceMessage || "Wallet services are temporarily unavailable for maintenance."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-3 ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      }`}
    >
      <div
        className={`flex justify-center items-center rounded-sm py-2 ${
          isDarkMode
            ? "bg-gray-700 border border-blue-500"
            : "bg-[#F1F4FC] border border-blue-500"
        }`}
      >
        <div className="flex flex-col gap-1">
          <span
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-500"
            }`}
          >
            Naira Balance
          </span>
          <div className="flex justify-center items-center">
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-500"
              }`}
            >
              ₦
            </span>
            <span
              className={`text-xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              {walletData?.balance?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label
          className={`block mb-1 ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Select Bank Account
        </label>
        <Select
          options={bankOptions}
          placeholder="Select a bank account..."
          onChange={handleBankAccountChange}
          value={formik.values.selectedBank}
          className={`mb-4 ${
            formik.touched.selectedBank && formik.errors.selectedBank
              ? "border-red-500"
              : isDarkMode
              ? "border-gray-600"
              : "border-gray-300"
          }`}
          isClearable
          noOptionsMessage={() => <NoBankAccounts />}
          isDisabled={verifyingAccount}
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: isDarkMode ? "#2d3748" : "#ffffff",
              borderColor:
                formik.touched.selectedBank && formik.errors.selectedBank
                  ? "red"
                  : isDarkMode
                  ? "#4a5568"
                  : "#d1d5db",
            color: isDarkMode ? "#cbd5e0" : "#000000",
            }),
            placeholder: (base) => ({
              ...base,
              color: isDarkMode ? "#a0aec0" : "#9ca3af",
            }),
            singleValue: (base) => ({
              ...base,
              color: isDarkMode ? "#cbd5e0" : "#000000",
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: isDarkMode ? "#2d3748" : "#ffffff",
            }),
            option: (base, { isFocused }) => ({
              ...base,
              backgroundColor: isFocused
                ? isDarkMode
                  ? "#4a5568"
                  : "#e5f3ff"
                : isDarkMode
                ? "#2d3748"
                : "#ffffff",
              color: isDarkMode ? "#cbd5e0" : "#000000",
            }),
          }}
        />

        {/* Account Name Display */}
        {selectedAccountName && (
          <div className={`mb-4 p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Account Name:
                </span>
                <p className={`text-sm font-semibold mt-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {selectedAccountName}
                </p>
              </div>
              {verifyingAccount && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  <span className={`ml-2 text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Verifying...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        {formik.touched.selectedBank && formik.errors.selectedBank && (
          <div className="text-red-500 text-sm mb-2">
            {formik.errors.selectedBank}
          </div>
        )}
      </div>

      <TextField
        label="Amount"
        helperText={`Enter the amount you want to withdraw (Min: ₦${walletSettings?.minWithdrawalAmount || 100}, Max: ₦${walletSettings?.maxWithdrawalAmount?.toLocaleString() || "500,000"})`}
        value={formik.values.amount}
        onChange={handleAmountChange}
        name="amount"
        error={formik.touched.amount && Boolean(formik.errors.amount)}
        isDarkMode={isDarkMode}
      />
      {formik.touched.amount && formik.errors.amount && (
        <div className="text-red-500 text-sm mb-2">
          {formik.errors.amount}
        </div>
      )}

      {/* Fee Deduction Method Selection */}
      {withdrawalFee > 0 && (
        <div className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <h4 className={`text-sm font-medium mb-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            How would you like to pay the withdrawal fee?
          </h4>

          <div className="space-y-3">
            {/* From Wallet Option */}
            {walletSettings?.withdrawalFee?.deductionMethods?.fromWallet && (
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="fee-from-wallet"
                  name="feeDeductionMethod"
                  value="fromWallet"
                  checked={feeDeductionMethod === "fromWallet"}
                  onChange={(e) => setFeeDeductionMethod(e.target.value)}
                  className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-300'
                  }`}
                />
                <div className="flex-1">
                  <label
                    htmlFor="fee-from-wallet"
                    className={`block text-sm font-medium cursor-pointer ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Deduct from my wallet balance
                  </label>
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Fee: ₦{withdrawalFee.toLocaleString()} | Total deduction: ₦{(withdrawalFee + parseFloat(formik.values.amount.replace(/,/g, '')) || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* From Withdrawal Amount Option */}
            {walletSettings?.withdrawalFee?.deductionMethods?.fromWithdrawal && (
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="fee-from-withdrawal"
                  name="feeDeductionMethod"
                  value="fromWithdrawal"
                  checked={feeDeductionMethod === "fromWithdrawal"}
                  onChange={(e) => setFeeDeductionMethod(e.target.value)}
                  className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-300'
                  }`}
                />
                <div className="flex-1">
                  <label
                    htmlFor="fee-from-withdrawal"
                    className={`block text-sm font-medium cursor-pointer ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Deduct from withdrawal amount
                  </label>
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Fee: ₦{withdrawalFee.toLocaleString()} | You'll receive: ₦{((parseFloat(formik.values.amount.replace(/,/g, '')) || 0) - withdrawalFee).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fee Display */}
      {withdrawalFee > 0 && (
        <div className={`p-3 rounded-lg border ${
          isDarkMode ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className={isDarkMode ? 'text-blue-200' : 'text-blue-800'}>
              Withdrawal Fee:
            </span>
            <span className={`font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              ₦{withdrawalFee.toLocaleString()}
            </span>
          </div>
          {(() => {
            const amount = parseFloat(formik.values.amount.replace(/,/g, '')) || 0;
            const { percentage = 1, fixedFee = 50, cap = 500 } = walletSettings?.withdrawalFee || {};
            const percentageFee = amount * (percentage / 100);
            const calculatedFee = fixedFee + percentageFee;
            const isCapped = calculatedFee > cap;

            return (
              <div className={`text-xs space-y-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                <div className="flex justify-between">
                  <span>Fixed Fee:</span>
                  <span>₦{fixedFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{percentage}% of ₦{amount.toLocaleString()}:</span>
                  <span>₦{percentageFee.toLocaleString()}</span>
                </div>
                {isCapped && (
                  <div className="flex justify-between font-medium">
                    <span>Fee Cap:</span>
                    <span>₦{cap.toLocaleString()}</span>
                  </div>
                )}
                <p className="mt-2 pt-2 border-t border-blue-300">
                  This fee will be deducted from your withdrawal amount.
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Settings Information */}
      <div className={`p-3 rounded-lg ${
        isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
      }`}>
        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Withdrawal Limits
        </h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Minimum:</span>
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              ₦{walletSettings?.minWithdrawalAmount || 100}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Maximum:</span>
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              ₦{walletSettings?.maxWithdrawalAmount?.toLocaleString() || "500,000"}
            </span>
          </div>
          {walletSettings?.deductFeesFromWithdrawals && (
            <>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Processing Fee:</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Enabled</span>
              </div>
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Fixed Fee:</span>
                    <span>₦{walletSettings.withdrawalFee?.fixedFee || 50}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentage:</span>
                    <span>{walletSettings.withdrawalFee?.percentage || 1}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee Cap:</span>
                    <span>₦{walletSettings.withdrawalFee?.cap?.toLocaleString() || "500"}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Button
        onClick={formik.handleSubmit}
        disabled={loading}
        className={`w-full ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? <Spinner /> : "Submit Withdrawal Request"}
      </Button>
    </div>
  );
};

export default Withdraw;