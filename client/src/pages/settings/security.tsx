import React, { useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";
import Button from "../../components/ui/forms/button";
import Textarea from "../../components/ui/forms/input";
import { useMutation } from "@tanstack/react-query";
import { updateUser } from "../../api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const textLink = "inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-accent hover:underline hover:underline-offset-4";
const modalOverlay =
  "fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4";
const modalPanel =
  "relative flex max-h-full w-full max-w-[480px] flex-col overflow-hidden rounded-t-lg bg-paper text-ink shadow-xl sm:rounded-lg sm:max-h-[90vh]";

const Security = () => {
  const user = useSelector((state: any) => state.user.user);
  const [changePassword, setChangePassword] = useState(false);
  const [setTransactionPin, setSetTransactionPin] = useState(false);

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (data: any) => {
      if (data.transactionPin !== undefined) {
        toast.success("Transaction PIN updated successfully!");
        closeTransactionPinModal();
      } else {
        toast.success("Password updated successfully!");
        closeModal();
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred while updating.");
    },
  });

  const closeModal = () => setChangePassword(false);
  const closeTransactionPinModal = () => setSetTransactionPin(false);

  return (
    <div>
      <h2 className="mb-3 text-[22px] font-bold">Security</h2>
      <div className="w-full max-w-[384px] rounded-md bg-bg px-4 py-3">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="block text-[13px] text-muted">Password</span>
              <span className="text-[13px]">*******</span>
            </div>
            <button onClick={() => setChangePassword(true)} className={`${textLink} text-[13px]`}>
              Change Password
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="block text-[13px] text-muted">Transaction Pin</span>
              <span className="text-[13px]">{user?.hasTransactionPin ? "****" : "Not Set"}</span>
            </div>
            <button onClick={() => setSetTransactionPin(true)} className={`${textLink} text-[13px]`}>
              {user?.hasTransactionPin ? "Change PIN" : "Set PIN"}
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="block text-[13px] text-muted">2FA Settings</span>
              <span className="text-[13px]">Add an extra layer of security</span>
            </div>
            <span className="text-xs font-bold text-danger">Not Available</span>
          </div>
        </div>
      </div>

      {changePassword && (
        <div className={modalOverlay} onClick={closeModal}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="relative max-h-full min-h-0 flex-1 overflow-y-auto p-6">
              <button
                onClick={closeModal}
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink"
                aria-label="Close Modal"
              >
                <FaTimes />
              </button>
              <h2 className="mb-4 text-xl font-bold">Update Password</h2>
              <Formik
                initialValues={{ oldPassword: "", newPassword: "", confirmPassword: "" }}
                validationSchema={Yup.object({
                  oldPassword: Yup.string().required("Current password is required"),
                  newPassword: Yup.string()
                    .required("New password is required")
                    .min(6, "Password must be at least 6 characters"),
                  confirmPassword: Yup.string()
                    .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
                    .required("Confirm password is required"),
                })}
                onSubmit={(values) => {
                  mutation.mutate({ oldPassword: values.oldPassword, newPassword: values.newPassword });
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <Field name="oldPassword">
                        {({ field, meta }: any) => (
                          <Textarea {...field} type="password" label="Current Password" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="oldPassword" component="div" className="mt-1 text-[11px] text-danger" />
                    </div>
                    <div className="mb-4">
                      <Field name="newPassword">
                        {({ field, meta }: any) => (
                          <Textarea {...field} type="password" label="New Password" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="newPassword" component="div" className="mt-1 text-[11px] text-danger" />
                    </div>
                    <div className="mb-4">
                      <Field name="confirmPassword">
                        {({ field, meta }: any) => (
                          <Textarea {...field} type="password" label="Confirm Password" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-[11px] text-danger" />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {setTransactionPin && (
        <div className={modalOverlay} onClick={closeTransactionPinModal}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="relative max-h-full min-h-0 flex-1 overflow-y-auto p-6">
              <button
                onClick={closeTransactionPinModal}
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink"
                aria-label="Close Modal"
              >
                <FaTimes />
              </button>
              <h2 className="mb-4 text-xl font-bold">
                {user?.hasTransactionPin ? "Change Transaction PIN" : "Set Transaction PIN"}
              </h2>
              <Formik
                initialValues={{ currentPin: "", newPin: "", confirmPin: "" }}
                validationSchema={Yup.object({
                  currentPin: user?.hasTransactionPin
                    ? Yup.string()
                        .required("Current PIN is required")
                        .matches(/^\d{4,6}$/, "PIN must be 4-6 digits")
                    : Yup.string(),
                  newPin: Yup.string().required("New PIN is required").matches(/^\d{4,6}$/, "PIN must be 4-6 digits"),
                  confirmPin: Yup.string().oneOf([Yup.ref("newPin"), null], "PINs must match").required("Confirm PIN is required"),
                })}
                onSubmit={(values) => {
                  const updateData: any = {
                    transactionPin: values.newPin,
                    ...(user?.hasTransactionPin && { currentTransactionPin: values.currentPin }),
                  };
                  mutation.mutate(updateData);
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    {user?.hasTransactionPin && (
                      <div className="mb-3">
                        <Field name="currentPin">
                          {({ field, meta }: any) => (
                            <Textarea {...field} type="password" label="Current PIN" error={meta.touched && meta.error} />
                          )}
                        </Field>
                        <ErrorMessage name="currentPin" component="div" className="mt-1 text-[11px] text-danger" />
                      </div>
                    )}
                    <div className="mb-4">
                      <Field name="newPin">
                        {({ field, meta }: any) => (
                          <Textarea {...field} type="password" label="New PIN (4-6 digits)" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="newPin" component="div" className="mt-1 text-[11px] text-danger" />
                    </div>
                    <div className="mb-4">
                      <Field name="confirmPin">
                        {({ field, meta }: any) => (
                          <Textarea {...field} type="password" label="Confirm New PIN" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="confirmPin" component="div" className="mt-1 text-[11px] text-danger" />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Setting PIN..." : user?.hasTransactionPin ? "Change PIN" : "Set PIN"}
                    </Button>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Security;
