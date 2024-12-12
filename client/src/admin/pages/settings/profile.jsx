import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useSelector, useDispatch } from "react-redux";
import { FaEdit, FaTimes } from "react-icons/fa";
import Button from "../../../components/ui/forms/button";
import { useMutation } from "@tanstack/react-query";
import { updateAdmin } from "../../api";
import { updateAdminRedux } from "../../../actions/adminActions";

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.admin.admin);
  const [isPhoneNumberEditMode, setIsPhoneNumberEditMode] = useState(false);
  const formik = useFormik({
    initialValues: {
      phoneNumber: user?.phoneNumber || "",
    },
    validationSchema: Yup.object({
      phoneNumber: Yup.string()
        .required("Phone number is required")
        .matches(/^\+?[0-9]{10,15}$/, "Phone number is not valid"),
    }),
    onSubmit: (values) => {
      mutate(values.phoneNumber);
    },
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: (phoneNumber) => updateAdmin({ phoneNumber }),
    onSuccess: (data) => {
      toast.success("Phone number updated successfully");
      dispatch(updateAdminRedux(data));
      setIsPhoneNumberEditMode(false);
      formik.resetForm();
      formik.setFieldValue("phoneNumber", data.phoneNumber);
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to update phone number";
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (user?.phoneNumber) {
      formik.setFieldValue("phoneNumber", user.phoneNumber);
    }
  }, [user]);

  const closeModal = () => {
    setIsPhoneNumberEditMode(false);
  };

  return (
    <div className="border border-solid border-gray-200 rounded-md md:p-6 p-4 w-full bg-white dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Profile</h2>
      <div className="max-w-sm w-auto">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.username}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Unique ID:</span>
            <span>{user?._id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Phone Number:</span>
            <div className="flex gap-2">
              <span>{user?.phoneNumber}</span>
              <button
                onClick={() => setIsPhoneNumberEditMode(true)}
                className="text-blue-500 hover:text-blue-600"
                aria-label="Edit Phone Number"
              >
                <FaEdit className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Country:</span>
            <span>Nigeria</span>
          </div>
        </div>
      </div>

      {isPhoneNumberEditMode && (
        <div className="fixed top-0 right-0 bottom-0 left-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="fixed top-0 right-0 bg-white dark:bg-gray-800 shadow-md rounded-md p-6 w-full max-w-md">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close Modal"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Update Phone Number</h2>
            <div className="flex flex-col w-full my-5">
              <label htmlFor="phoneNumber" className="mb-1 block text-gray-500 dark:text-gray-400">
                Phone Number
              </label>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="NG"
                id="phoneNumber"
                value={formik.values.phoneNumber}
                onChange={(phone) => formik.setFieldValue("phoneNumber", phone)}
                className={`w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter phone number"
                disabled={isLoading}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && formik.isValid) {
                    formik.handleSubmit();
                  }
                }}
              />
              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <div className="text-red-600 text-sm">
                  {formik.errors.phoneNumber}
                </div>
              )}
            </div>
            <div className="my-6">
              <Button
                type="submit"
                disabled={!formik.values.phoneNumber || isLoading}
                onClick={formik.handleSubmit}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v2a6 6 0 100 12v2a8 8 0 01-8-8z"
                      />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;