import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useSelector, useDispatch } from "react-redux";
import { FaEdit, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import Button from "../../components/ui/forms/button";
import { useMutation } from "@tanstack/react-query";
import { updateUser, deleteUser } from "../../api";
import { updateUserDispatch } from "../../actions/userActions";
import percentageImage from "../../assets/percentage.svg";

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [isPhoneNumberEditMode, setIsPhoneNumberEditMode] = useState(false);
  const [isKYCEditMode, setIsKYCEditMode] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const isDarkMode = useSelector((state) => state.theme.isDarkMode); // Get theme state

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
    mutationFn: (phoneNumber) => updateUser({ phoneNumber }),
    onSuccess: (data) => {
      toast.success("Phone number updated successfully");
      dispatch(updateUserDispatch(data));
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

  const closeModal = () => setIsPhoneNumberEditMode(false);
  const closeKYCModal = () => setIsKYCEditMode(false);
  const closeDeleteModal = () => setIsDelete(false);

  const handleDelete = async () => {
    try {
      const response = await deleteUser();
      toast.success(response.data);
      setIsDelete(false);
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className={`border rounded-md p-4 md:p-6 w-full ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Profile</h2>
      <div className="max-w-sm w-full mx-auto">
        <div className="flex flex-col items-center space-y-3 md:space-y-4 mb-4 md:mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl md:text-2xl font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold">{user?.username}</h2>
            <p className="text-gray-500 text-sm md:text-base">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500 text-sm md:text-base">Unique ID:</span>
            <span className="text-xs md:text-sm font-mono break-all">{user?._id}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500 text-sm md:text-base">Phone Number:</span>
            <div className="flex gap-2 items-center">
              <span className="text-sm md:text-base">{user?.phoneNumber}</span>
              <button
                onClick={() => setIsPhoneNumberEditMode(true)}
                className="text-blue-500 hover:text-blue-600 p-1"
                aria-label="Edit Phone Number"
              >
                <FaEdit className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500 text-sm md:text-base">Country:</span>
            <span className="text-sm md:text-base">Nigeria</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500 text-sm md:text-base">KYC Status:</span>
            <div className="flex gap-2 items-center">
              <span className="text-red-500 font-medium text-sm md:text-base">Not Set</span>
              <button
                onClick={() => setIsKYCEditMode(true)}
                className="text-blue-500 hover:text-blue-600 p-1"
                aria-label="Update KYC"
              >
                <FaEdit className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-6 text-left">
          <button
            onClick={() => setIsDelete(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-md w-full text-sm md:text-base font-medium"
          >
            Delete User Account
          </button>
        </div>
      </div>

      {/* Phone Number Edit Modal */}
      {isPhoneNumberEditMode && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-md rounded-md p-4 md:p-6 w-full max-w-md mx-auto">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close Modal"
            >
              <FaTimes className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Update Phone Number</h2>
            <div className="flex flex-col w-full my-5">
              <label htmlFor="phoneNumber" className="mb-1 block text-gray-500">
                Phone Number
              </label>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="NG"
                id="phoneNumber"
                value={formik.values.phoneNumber}
                onChange={(phone) => formik.setFieldValue("phoneNumber", phone)}
                className={`w-full p-2 border rounded bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500`}
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

      {/* KYC Update Modal */}
      {isKYCEditMode && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-md rounded-md p-4 md:p-6 w-full max-w-md mx-auto">
            <button
              onClick={closeKYCModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close Modal"
            >
              <FaTimes className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Update KYC</h2>
            <div className="flex flex-col justify-center items-center gap-3">
              <img
                className="w-32 h-32 object-cover"
                src={percentageImage}
                alt="Feature Coming Soon"
              />
              <p className="text-gray-600 text-md text-center font-semibold">
                Feature Coming Soon!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-md rounded-md p-4 md:p-6 w-full max-w-md mx-auto">
            <button
              onClick={closeDeleteModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close Modal"
            >
              <FaTimes className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <FaExclamationTriangle className="text-red-500 mb-3 md:mb-4 text-xl md:text-2xl" />
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
              Are you sure you want to delete your account?
            </h2>
            <p className="text-gray-700 mb-3 md:mb-4 text-sm md:text-base">This action is irreversible.</p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-0">
              <button
                onClick={closeDeleteModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded order-2 sm:order-1 sm:mr-4 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded order-1 sm:order-2 w-full sm:w-auto"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;