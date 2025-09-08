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
    <div className="space-y-8">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
              <FaEdit className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2">{user?.username}</h2>
            <p className="text-blue-100 text-lg mb-2">{user?.email}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">Admin Account</span>
              <span className="bg-green-500/20 px-3 py-1 rounded-full">Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FaEdit className="w-4 h-4 text-white" />
            </div>
            Basic Information
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unique ID</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user?._id}</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Country</p>
                <p className="font-semibold text-gray-900 dark:text-white">Nigeria</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <FaEdit className="w-4 h-4 text-white" />
            </div>
            Contact Information
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone Number</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.phoneNumber}</p>
                </div>
                <button
                  onClick={() => setIsPhoneNumberEditMode(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  aria-label="Edit Phone Number"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email Address</p>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">Admin</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Account Type</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">Active</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">High</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Security Level</p>
          </div>
        </div>
      </div>

      {isPhoneNumberEditMode && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full mb-4">
                <FaEdit className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Phone Number
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter your new phone number below
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="NG"
                  id="phoneNumber"
                  value={formik.values.phoneNumber}
                  onChange={(phone) => formik.setFieldValue("phoneNumber", phone)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                  disabled={isLoading}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && formik.isValid) {
                      formik.handleSubmit();
                    }
                  }}
                />
                {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                  <div className="text-red-600 text-sm mt-1">
                    {formik.errors.phoneNumber}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formik.values.phoneNumber || isLoading}
                  onClick={formik.handleSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <FaEdit className="h-5 w-5 mr-2" />
                      Update Number
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;