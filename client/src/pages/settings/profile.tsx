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
    onSuccess: (data) => {
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
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Profile</h2>
      <div style={{ maxWidth: 384, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--ot-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 700 }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{user?.username}</h3>
            <p style={{ color: 'var(--ot-muted)', fontSize: 13, margin: 0 }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ot-muted)', fontSize: 13 }}>Unique ID:</span>
            <span style={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: '60%', textAlign: 'right' }}>{user?._id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ot-muted)', fontSize: 13 }}>Phone Number:</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>{user?.phoneNumber}</span>
              <button onClick={() => setIsPhoneNumberEditMode(true)} className="ot-icon-button" style={{ width: 28, height: 28 }} aria-label="Edit Phone Number">
                <FaEdit />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ot-muted)', fontSize: 13 }}>Country:</span>
            <span style={{ fontSize: 13 }}>Nigeria</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ot-muted)', fontSize: 13 }}>KYC Status:</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: '#b84545', fontWeight: 500, fontSize: 13 }}>Not Set</span>
              <button onClick={() => setIsKYCEditMode(true)} className="ot-icon-button" style={{ width: 28, height: 28 }} aria-label="Update KYC">
                <FaEdit />
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button onClick={() => setIsDelete(true)} className="ot-button ot-button-danger" style={{ width: '100%' }}>
            Delete User Account
          </button>
        </div>
      </div>

      {isPhoneNumberEditMode && (
        <div className="ot-modal-overlay" onClick={closeModal}>
          <div className="ot-modal ot-modal-md" onClick={e => e.stopPropagation()}>
            <div className="ot-modal-scroll" style={{ padding: 24 }}>
              <button onClick={closeModal} className="ot-icon-button" style={{ position: 'absolute', top: 12, right: 12 }} aria-label="Close Modal">
                <FaTimes />
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Update Phone Number</h2>
              <div style={{ marginBottom: 20 }}>
                <label className="ot-field-label">Phone Number</label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="NG"
                  id="phoneNumber"
                  value={formik.values.phoneNumber}
                  onChange={(phone) => formik.setFieldValue("phoneNumber", phone)}
                  className="ot-field"
                  placeholder="Enter phone number"
                  disabled={isPending}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && formik.isValid) formik.handleSubmit();
                  }}
                />
                {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                  <div className="ot-field-error">{formik.errors.phoneNumber}</div>
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
        <div className="ot-modal-overlay" onClick={closeKYCModal}>
          <div className="ot-modal ot-modal-md" onClick={e => e.stopPropagation()}>
            <div className="ot-modal-scroll" style={{ padding: 24, textAlign: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Update KYC</h2>
              <img src={percentageImage} alt="Feature Coming Soon" style={{ width: 128, height: 128, objectFit: 'cover', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--ot-muted)', fontWeight: 600 }}>Feature Coming Soon!</p>
            </div>
          </div>
        </div>
      )}

      {isDelete && (
        <div className="ot-modal-overlay" onClick={closeDeleteModal}>
          <div className="ot-modal ot-modal-md" onClick={e => e.stopPropagation()}>
            <div className="ot-modal-scroll" style={{ padding: 24 }}>
              <FaExclamationTriangle style={{ color: '#b84545', fontSize: 24, marginBottom: 12 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Are you sure you want to delete your account?</h2>
              <p style={{ color: 'var(--ot-muted)', marginBottom: 20, fontSize: 13 }}>This action is irreversible.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={closeDeleteModal} className="ot-button ot-button-secondary">Cancel</button>
                <button onClick={handleDelete} className="ot-button ot-button-danger">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
