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

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success("Password updated successfully!");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || "An error occurred while updating password.");
    },
  });

  const closeModal = () => {
    setChangePassword(false);
  };

  const closeKYCModal = () => {
    setIsKYCEditMode(false);
  };

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 w-full">
      <h2 className="text-2xl font-bold mb-4">Security</h2>
      <div className="max-w-sm w-auto bg-[#F7F9FB] dark:bg-gray-800 py-2 px-4 rounded-md">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">Password</span>
              <span className="text-blue-900">*******</span>
            </div>
            <button
              onClick={() => setChangePassword(true)}
              className="text-blue-400 font-semibold hover:text-blue-600"
              aria-label="Change Password"
            >
              Change Password
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">Transaction Pin</span>
              <span className="text-blue-900">****</span>
            </div>
            <span className="text-sm font-bold text-red-500">
              Not Available
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">2FA Settings</span>
              <span className="text-blue-900">
                Add an extra layer of security
              </span>
            </div>
            <span className="text-sm font-bold text-red-500">
              Not Available
            </span>
          </div>
        </div>
      </div>

      {changePassword && (
        <div className="fixed top-0 right-0 bottom-0 left-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="fixed top-0 right-0 bg-white shadow-md rounded-md p-6 w-full max-w-md h-screen w-80">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close Modal"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4">Update Password</h2>
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
    </div>
  );
};

export default Security;
