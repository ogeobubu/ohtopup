import React from "react";
import Select from "react-select";
import TextField from "../../components/ui/forms/input";
import Button from "../../components/ui/forms/button";
import { useFormik } from "formik";
import * as Yup from "yup";
import { withdrawFunds } from "../../api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const Withdraw = ({ handleShowBanks, walletData, user, closeModal }) => {
  const queryClient = useQueryClient();

  const bankOptions =
    user?.bankAccounts?.map((account) => ({
      value: account.accountNumber,
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
        .max(walletData?.balance || 0, "Insufficient funds"),
    }),
    onSubmit: async (values) => {
      try {
        const { amount, selectedBank } = values;
        await withdrawFunds({
          amount: parseFloat(amount),
          bankName: selectedBank.label.split(" - ")[0],
          accountNumber: selectedBank.value,
        });
        toast.success("Withdrawal successful!");

        await queryClient.invalidateQueries(["wallet"]);

        closeModal();

        formik.resetForm();
        formik.setFieldValue("selectedBank", null);
      } catch (error) {
        toast.error("Error withdrawing funds: " + error.message);
      }
    },
  });

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
    <div className="space-y-3">
      <div className="bg-[#F1F4FC] flex justify-center items-center rounded-sm border border-solid border-blue-500 py-2">
        <div className="flex flex-col gap-1">
          <span className="text-gray-500 text-sm">Naira Balance</span>
          <div className="flex justify-center items-center">
            <span className="text-sm text-gray-500">₦</span>
            <span className="text-xl font-bold">
              {walletData?.balance?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-gray-700 mb-1">Select Bank Account</label>
        <Select
          options={bankOptions}
          placeholder="Select a bank account..."
          onChange={(option) => formik.setFieldValue("selectedBank", option)}
          className={`mb-4 ${
            formik.touched.selectedBank && formik.errors.selectedBank
              ? "border-red-500"
              : ""
          }`}
          isClearable
          noOptionsMessage={() => <NoBankAccounts />}
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
      />

      <Button onClick={formik.handleSubmit}>Withdraw</Button>
    </div>
  );
};

export default Withdraw;
