import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { FaEdit, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import Button from "../../components/ui/forms/button";
import Textarea from "../../components/ui/forms/input";
import { useMutation } from "@tanstack/react-query";
import { updateUser } from "../../api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const Security = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [changePassword, setChangePassword] = useState(false);
  const [isKYCEditMode, setIsKYCEditMode] = useState(false);
  const [setTransactionPin, setSetTransactionPin] = useState(false);

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      if (data.transactionPin !== undefined) {
        toast.success("Transaction PIN updated successfully!");
        closeTransactionPinModal();
      } else {
        toast.success("Password updated successfully!");
        closeModal();
      }
    },
    onError: (error) => {
      toast.error(error.message || "An error occurred while updating.");
    },
  });

  const closeModal = () => {
    setChangePassword(false);
  };

  const closeTransactionPinModal = () => {
    setSetTransactionPin(false);
  };

  const closeKYCModal = () => {
    setIsKYCEditMode(false);
  };

  return (
    <div className="border border-solid border-gray-200 rounded-md p-4 md:p-6 w-full">
      <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Security</h2>
      <div className="max-w-sm w-full bg-[#F7F9FB] dark:bg-gray-800 py-2 px-3 md:px-4 rounded-md">
        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 text-sm md:text-base">Password</span>
              <span className="text-blue-900 text-sm md:text-base">*******</span>
            </div>
            <button
              onClick={() => setChangePassword(true)}
              className="text-blue-400 font-semibold hover:text-blue-600 text-sm md:text-base self-start sm:self-auto"
              aria-label="Change Password"
            >
              Change Password
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 text-sm md:text-base">Transaction Pin</span>
              <span className="text-blue-900 text-sm md:text-base">
                {user?.transactionPin ? "****" : "Not Set"}
              </span>
            </div>
            <button
              onClick={() => setSetTransactionPin(true)}
              className="text-blue-400 font-semibold hover:text-blue-600 text-sm md:text-base self-start sm:self-auto"
              aria-label="Set Transaction PIN"
            >
              {user?.transactionPin ? "Change PIN" : "Set PIN"}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 text-sm md:text-base">2FA Settings</span>
              <span className="text-blue-900 text-sm md:text-base">
                Add an extra layer of security
              </span>
            </div>
            <span className="text-xs md:text-sm font-bold text-red-500 self-start sm:self-auto">
              Not Available
            </span>
          </div>
        </div>
      </div>

      {changePassword && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-md rounded-md p-4 md:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close Modal"
            >
              <FaTimes className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Update Password</h2>
            <Formik
              initialValues={{
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
              }}
              validationSchema={Yup.object({
                oldPassword: Yup.string().required("Current password is required"),
                newPassword: Yup.string()
                  .required("New password is required")
                  .min(6, "Password must be at least 6 characters"),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('newPassword'), null], "Passwords must match")
                  .required("Confirm password is required"),
              })}
              onSubmit={(values, { setSubmitting }) => {
                mutation.mutate({ 
                  oldPassword: values.oldPassword, 
                  newPassword: values.newPassword 
                });
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                <div className="mb-2">
                  <Field name="oldPassword">
                    {({ field, meta }) => (
                      <Textarea
                        {...field}
                        type="password"
                        label="Current Password"
                        error={meta.touched && meta.error}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="oldPassword" component="div" className="text-red-500" />
                </div>
                <div className="mb-4">
                  <Field name="newPassword">
                    {({ field, meta }) => (
                      <Textarea
                        {...field}
                        type="password"
                        label="New Password"
                        error={meta.touched && meta.error}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="newPassword" component="div" className="text-red-500" />
                </div>
                <div className="mb-4">
                  <Field name="confirmPassword">
                    {({ field, meta }) => (
                      <Textarea
                        {...field}
                        type="password"
                        label="Confirm Password"
                        error={meta.touched && meta.error}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="confirmPassword" component="div" className="text-red-500" />
                </div>
                <div className="my-6">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {setTransactionPin && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-md rounded-md p-4 md:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeTransactionPinModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close Modal"
            >
              <FaTimes className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
              {user?.transactionPin ? "Change Transaction PIN" : "Set Transaction PIN"}
            </h2>
            <Formik
              initialValues={{
                currentPin: '',
                newPin: '',
                confirmPin: '',
              }}
              validationSchema={Yup.object({
                currentPin: user?.transactionPin ? Yup.string()
                  .required("Current PIN is required")
                  .matches(/^\d{4,6}$/, "PIN must be 4-6 digits") : Yup.string(),
                newPin: Yup.string()
                  .required("New PIN is required")
                  .matches(/^\d{4,6}$/, "PIN must be 4-6 digits"),
                confirmPin: Yup.string()
                  .oneOf([Yup.ref('newPin'), null], "PINs must match")
                  .required("Confirm PIN is required"),
              })}
              onSubmit={(values, { setSubmitting }) => {
                const updateData = {
                  transactionPin: values.newPin,
                  ...(user?.transactionPin && { currentTransactionPin: values.currentPin })
                };
                mutation.mutate(updateData);
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  {user?.transactionPin && (
                    <div className="mb-2">
                      <Field name="currentPin">
                        {({ field, meta }) => (
                          <Textarea
                            {...field}
                            type="password"
                            label="Current PIN"
                            error={meta.touched && meta.error}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="currentPin" component="div" className="text-red-500" />
                    </div>
                  )}
                  <div className="mb-4">
                    <Field name="newPin">
                      {({ field, meta }) => (
                        <Textarea
                          {...field}
                          type="password"
                          label="New PIN (4-6 digits)"
                          error={meta.touched && meta.error}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="newPin" component="div" className="text-red-500" />
                  </div>
                  <div className="mb-4">
                    <Field name="confirmPin">
                      {({ field, meta }) => (
                        <Textarea
                          {...field}
                          type="password"
                          label="Confirm New PIN"
                          error={meta.touched && meta.error}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="confirmPin" component="div" className="text-red-500" />
                  </div>
                  <div className="my-6">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Setting PIN..." : (user?.transactionPin ? "Change PIN" : "Set PIN")}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default Security;
