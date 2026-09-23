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

const secondaryBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-[15px] py-[11px] text-[13px] font-semibold text-ink transition hover:bg-tint";
const dangerBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-danger px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:opacity-90";
const iconBtn =
  "flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink";
const modalOverlay =
  "fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4";
const modalPanel =
  "relative flex max-h-full w-full max-w-[480px] flex-col overflow-hidden rounded-t-lg bg-paper text-ink shadow-xl sm:rounded-lg sm:max-h-[90vh]";

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user?.user);
  const [isPhoneNumberEditMode, setIsPhoneNumberEditMode] = useState(false);
  const [isKYCEditMode, setIsKYCEditMode] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

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

  const { mutate, isPending } = useMutation({
    mutationFn: (phoneNumber: string) => updateUser({ phoneNumber }),
    onSuccess: (data: any) => {
      toast.success("Phone number updated successfully");
      dispatch(updateUserDispatch(data));
      setIsPhoneNumberEditMode(false);
      formik.resetForm();
      formik.setFieldValue("phoneNumber", data.phoneNumber);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to update phone number";
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (user?.phoneNumber) {
      formik.setFieldValue("phoneNumber", user.phoneNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const closeModal = () => setIsPhoneNumberEditMode(false);
  const closeKYCModal = () => setIsKYCEditMode(false);
  const closeDeleteModal = () => setIsDelete(false);

  const handleDelete = async () => {
    try {
      const response = await deleteUser();
      toast.success(response.data);
      setIsDelete(false);
    } catch (error: any) {
      toast.error(error);
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-[22px] font-bold">Profile</h2>
      <div className="w-full max-w-[384px]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent text-2xl font-bold text-white">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h3 className="m-0 text-xl font-bold">{user?.username}</h3>
            <p className="m-0 text-[13px] text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-muted">Unique ID:</span>
            <span className="max-w-[60%] break-all text-right font-mono text-xs">{user?._id}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-muted">Phone Number:</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px]">{user?.phoneNumber}</span>
              <button
                onClick={() => setIsPhoneNumberEditMode(true)}
                className={`${iconBtn} !h-7 !w-7`}
                aria-label="Edit Phone Number"
              >
                <FaEdit />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-muted">Country:</span>
            <span className="text-[13px]">Nigeria</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-muted">KYC Status:</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-danger">Not Set</span>
              <button
                onClick={() => setIsKYCEditMode(true)}
                className={`${iconBtn} !h-7 !w-7`}
                aria-label="Update KYC"
              >
                <FaEdit />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button onClick={() => setIsDelete(true)} className={`${dangerBtn} w-full`}>
            Delete User Account
          </button>
        </div>
      </div>

      {isPhoneNumberEditMode && (
        <div className={modalOverlay} onClick={closeModal}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="relative max-h-full min-h-0 flex-1 overflow-y-auto p-6">
              <button onClick={closeModal} className={`${iconBtn} absolute right-3 top-3`} aria-label="Close Modal">
                <FaTimes />
              </button>
              <h2 className="mb-4 text-xl font-bold">Update Phone Number</h2>
              <div className="mb-5">
                <label className="mb-2 block text-xs font-mediumish text-ink">Phone Number</label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="NG"
                  id="phoneNumber"
                  value={formik.values.phoneNumber}
                  onChange={(phone) => formik.setFieldValue("phoneNumber", phone)}
                  className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/40"
                  placeholder="Enter phone number"
                  disabled={isPending}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && formik.isValid) formik.handleSubmit();
                  }}
                />
                {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                  <div className="mt-1 text-[11px] text-danger">{formik.errors.phoneNumber}</div>
                )}
              </div>
              <Button type="submit" disabled={!formik.values.phoneNumber || isPending} onClick={formik.handleSubmit} onSuccess={() => {}}>
                {isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isKYCEditMode && (
        <div className={modalOverlay} onClick={closeKYCModal}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="relative max-h-full min-h-0 flex-1 overflow-y-auto p-6 text-center">
              <h2 className="mb-4 text-xl font-bold">Update KYC</h2>
              <img
                src={percentageImage}
                alt="Feature Coming Soon"
                className="mx-auto mb-3 h-32 w-32 object-cover"
              />
              <p className="font-semibold text-muted">Feature Coming Soon!</p>
            </div>
          </div>
        </div>
      )}

      {isDelete && (
        <div className={modalOverlay} onClick={closeDeleteModal}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="relative max-h-full min-h-0 flex-1 overflow-y-auto p-6">
              <FaExclamationTriangle className="mb-3 text-danger" size={24} />
              <h2 className="mb-3 text-xl font-bold">Are you sure you want to delete your account?</h2>
              <p className="mb-5 text-[13px] text-muted">This action is irreversible.</p>
              <div className="flex justify-end gap-2.5">
                <button onClick={closeDeleteModal} className={secondaryBtn}>
                  Cancel
                </button>
                <button onClick={handleDelete} className={dangerBtn}>
                  Delete Account
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
