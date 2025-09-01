import React, { useState } from "react";
import TextField from "../../../components/ui/forms/input";
import Button from "../../../components/ui/forms/button";
import { useFormik } from "formik";
import * as Yup from "yup";
import { redeemPoints } from "../../../api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const Redeem = ({ walletData, user, closeModal, isDarkMode }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const maxAmount = user?.points;

  const formik = useFormik({
    initialValues: {
      amount: "",
    },
    validationSchema: Yup.object({
      amount: Yup.number()
        .required("Amount is required")
        .min(10, "Amount must be at least 10 points")
        .max(maxAmount, `Amount cannot exceed ${maxAmount} points`),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await redeemPoints({
          pointsToRedeem: parseFloat(values.amount),
        });
        toast.success("Redeeming successful!");

        await queryClient.invalidateQueries(["user"]);

        closeModal();
        formik.resetForm();
      } catch (error) {
        toast.error("Error redeeming points: " + error.message);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="space-y-3">
      <div className="bg-[#F1F4FC] flex justify-center items-center rounded-sm border border-solid border-blue-500 py-2">
        <div className="flex flex-col gap-1">
          <span className="text-gray-500 text-sm">Points Balance</span>
          <div className="flex justify-center items-center">
            <span className="text-xl font-bold dark:text-gray-800">{user?.points || "0"}</span>
          </div>
          <span className="text-sm text-gray-500">
            10 Points = <strong className="font-bold">1 Naira</strong>
          </span>
        </div>
      </div>

      <TextField
        label="Amount"
        value={formik.values.amount}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        name="amount"
        error={formik.touched.amount && Boolean(formik.errors.amount)}
      />
      {formik.touched.amount && formik.errors.amount && (
        <div className="text-red-500 text-sm">{formik.errors.amount}</div>
      )}

      <Button onClick={formik.handleSubmit} disabled={loading}>
        {loading ? "Redeeming..." : "Redeem"}
      </Button>
    </div>
  );
};

export default Redeem;