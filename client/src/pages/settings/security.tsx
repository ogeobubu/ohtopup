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

const Security = () => {
  const user = useSelector((state) => state.user.user);
  const [changePassword, setChangePassword] = useState(false);
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

  const closeModal = () => setChangePassword(false);
  const closeTransactionPinModal = () => setSetTransactionPin(false);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Security</h2>
      <div style={{ maxWidth: 384, width: '100%', background: 'var(--ot-bg)', borderRadius: 6, padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: 'var(--ot-muted)', fontSize: 13, display: 'block' }}>Password</span>
              <span style={{ fontSize: 13 }}>*******</span>
            </div>
            <button onClick={() => setChangePassword(true)} className="ot-text-link" style={{ fontSize: 13 }}>Change Password</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: 'var(--ot-muted)', fontSize: 13, display: 'block' }}>Transaction Pin</span>
              <span style={{ fontSize: 13 }}>{user?.hasTransactionPin ? "****" : "Not Set"}</span>
            </div>
            <button onClick={() => setSetTransactionPin(true)} className="ot-text-link" style={{ fontSize: 13 }}>
              {user?.hasTransactionPin ? "Change PIN" : "Set PIN"}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: 'var(--ot-muted)', fontSize: 13, display: 'block' }}>2FA Settings</span>
              <span style={{ fontSize: 13 }}>Add an extra layer of security</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b84545' }}>Not Available</span>
          </div>
        </div>
      </div>

      {changePassword && (
        <div className="ot-modal-overlay" onClick={closeModal}>
          <div className="ot-modal ot-modal-md" onClick={e => e.stopPropagation()}>
            <div className="ot-modal-scroll" style={{ padding: 24 }}>
              <button onClick={closeModal} className="ot-icon-button" style={{ position: 'absolute', top: 12, right: 12 }} aria-label="Close Modal">
                <FaTimes />
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Update Password</h2>
              <Formik
                initialValues={{ oldPassword: '', newPassword: '', confirmPassword: '' }}
                validationSchema={Yup.object({
                  oldPassword: Yup.string().required("Current password is required"),
                  newPassword: Yup.string().required("New password is required").min(6, "Password must be at least 6 characters"),
                  confirmPassword: Yup.string().oneOf([Yup.ref('newPassword'), null], "Passwords must match").required("Confirm password is required"),
                })}
                onSubmit={(values, { setSubmitting }) => {
                  mutation.mutate({ oldPassword: values.oldPassword, newPassword: values.newPassword });
                  setSubmitting(false);
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div style={{ marginBottom: 12 }}>
                      <Field name="oldPassword">
                        {({ field, meta }) => (
                          <Textarea {...field} type="password" label="Current Password" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="oldPassword" component="div" className="ot-field-error" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <Field name="newPassword">
                        {({ field, meta }) => (
                          <Textarea {...field} type="password" label="New Password" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="newPassword" component="div" className="ot-field-error" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <Field name="confirmPassword">
                        {({ field, meta }) => (
                          <Textarea {...field} type="password" label="Confirm Password" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="confirmPassword" component="div" className="ot-field-error" />
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
        <div className="ot-modal-overlay" onClick={closeTransactionPinModal}>
          <div className="ot-modal ot-modal-md" onClick={e => e.stopPropagation()}>
            <div className="ot-modal-scroll" style={{ padding: 24 }}>
              <button onClick={closeTransactionPinModal} className="ot-icon-button" style={{ position: 'absolute', top: 12, right: 12 }} aria-label="Close Modal">
                <FaTimes />
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                {user?.hasTransactionPin ? "Change Transaction PIN" : "Set Transaction PIN"}
              </h2>
              <Formik
                initialValues={{ currentPin: '', newPin: '', confirmPin: '' }}
                validationSchema={Yup.object({
                  currentPin: user?.hasTransactionPin ? Yup.string().required("Current PIN is required").matches(/^\d{4,6}$/, "PIN must be 4-6 digits") : Yup.string(),
                  newPin: Yup.string().required("New PIN is required").matches(/^\d{4,6}$/, "PIN must be 4-6 digits"),
                  confirmPin: Yup.string().oneOf([Yup.ref('newPin'), null], "PINs must match").required("Confirm PIN is required"),
                })}
                onSubmit={(values, { setSubmitting }) => {
                  const updateData = {
                    transactionPin: values.newPin,
                    ...(user?.hasTransactionPin && { currentTransactionPin: values.currentPin })
                  };
                  mutation.mutate(updateData);
                  setSubmitting(false);
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    {user?.hasTransactionPin && (
                      <div style={{ marginBottom: 12 }}>
                        <Field name="currentPin">
                          {({ field, meta }) => (
                            <Textarea {...field} type="password" label="Current PIN" error={meta.touched && meta.error} />
                          )}
                        </Field>
                        <ErrorMessage name="currentPin" component="div" className="ot-field-error" />
                      </div>
                    )}
                    <div style={{ marginBottom: 16 }}>
                      <Field name="newPin">
                        {({ field, meta }) => (
                          <Textarea {...field} type="password" label="New PIN (4-6 digits)" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="newPin" component="div" className="ot-field-error" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <Field name="confirmPin">
                        {({ field, meta }) => (
                          <Textarea {...field} type="password" label="Confirm New PIN" error={meta.touched && meta.error} />
                        )}
                      </Field>
                      <ErrorMessage name="confirmPin" component="div" className="ot-field-error" />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Setting PIN..." : (user?.hasTransactionPin ? "Change PIN" : "Set PIN")}
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
