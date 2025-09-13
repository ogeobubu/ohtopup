import React, { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Select from "react-select";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Logo from "../../components/ui/logo";
import Textarea from "../../components/ui/forms/input";
import Button from "../../components/ui/forms/button";
import { createUser } from "../../api";

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderColor: "#d1d5db",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    backgroundColor: "#f9fafb",
    padding: "0.3rem",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#e0f2fe" : "#ffffff",
    color: "#111827",
    padding: "0.5rem 1rem",
    "&:active": {
      backgroundColor: "#bfdbfe",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#111827",
  }),
};

const options = [
  { value: "facebook", label: "Facebook" },
  { value: "friend", label: "Friend" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "google", label: "Google" },
];

const Create = ({ darkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      toast.success(data.message);
      navigate("/verify");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Error creating account";
      toast.error(errorMessage);
    },
  });

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .required("Username is required")
      .matches(/^[a-z0-9]+$/, "Username must be lowercase letters and numbers only (no spaces)")
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phoneNumber: Yup.string().required("Phone number is required"),
    referralCode: Yup.string(),
    password: Yup.string().required("Password is required"),
    source: Yup.string().required("Source is required"),
  });

  const queryParams = new URLSearchParams(location.search);
  const referralCode = queryParams.get("code") || "";

  return (
    <div className="flex md:flex-row justify-between">
      <div className="w-full py-0 md:py-4 h-screen overflow-y-auto">
        <div className="max-w-md flex justify-center flex-col w-auto m-auto w-full space-y-4">
          <Logo className="mx-auto w-auto" darkMode={darkMode} href="/" />
          <div className="flex justify-center w-auto flex-col gap-3 px-2 md:px-12">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              Create Your Account
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Please fill in the details below to sign up.
            </p>

            {/* Google OAuth Button */}
            <div className="my-6">
              <button
                onClick={() => window.location.href = '/api/users/auth/google'}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-lg border border-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>
            </div>
            <Formik
              initialValues={{
                username: "",
                email: "",
                phoneNumber: "",
                referralCode: referralCode,
                password: "",
                source: "",
              }}
              validationSchema={validationSchema}
              onSubmit={(values, { resetForm }) => {
                // Transform username to lowercase and remove spaces before submission
                const transformedValues = {
                  ...values,
                  username: values.username.toLowerCase().replace(/\s+/g, '')
                };

                localStorage.setItem(
                  "ohtopup-create",
                  JSON.stringify({
                    username: transformedValues.username,
                    email: transformedValues.email,
                  })
                );
                mutation.mutate(transformedValues);
                resetForm();
              }}
            >
              {({ setFieldValue, values, isValid, dirty }) => (
                <Form>
                  <Field name="username">
                    {({ field, meta, form }) => (
                      <Textarea
                        error={meta.touched && meta.error}
                        name={field.name}
                        {...field}
                        onChange={(e) => {
                          // Transform to lowercase and remove spaces in real-time
                          const transformedValue = e.target.value.toLowerCase().replace(/\s+/g, '');
                          form.setFieldValue('username', transformedValue);
                        }}
                        label="Username"
                        placeholder="Enter username (lowercase, no spaces)"
                      />
                    )}
                  </Field>

                  <Field name="email">
                    {({ field, meta }) => (
                      <Textarea
                        {...field}
                        type="email"
                        label="Email Address"
                        error={meta.touched && meta.error}
                        name={field.name}
                      />
                    )}
                  </Field>

                  <div className={`flex flex-col w-full my-5`}>
                    <label
                      className={`mb-1 ${
                        darkMode ? "text-gray-300" : "block text-gray-500 mb-2"
                      }`}
                    >
                      Phone Number
                    </label>
                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="NG"
                      value={values.phoneNumber}
                      onChange={(value) => setFieldValue("phoneNumber", value)}
                      className={`w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                      placeholder="Enter phone number"
                    />
                    <ErrorMessage
                      name="phoneNumber"
                      component="div"
                      className="text-red-500"
                    />
                  </div>

                  <Field name="referralCode">
                    {({ field, meta }) => (
                      <Textarea
                        {...field}
                        label="Referral Code (Optional)"
                        error={meta.touched && meta.error}
                        name={field.name}
                      />
                    )}
                  </Field>

                  <Field name="password">
                    {({ field, meta }) => (
                      <Textarea
                        {...field}
                        type="password"
                        label="Password"
                        error={meta.touched && meta.error}
                        name={field.name}
                      />
                    )}
                  </Field>

                  <div className="mb-4">
                    <label className="block text-gray-500 mb-2">
                      How did you hear about us?
                    </label>
                    <Select
                      styles={customStyles}
                      options={options}
                      onChange={(selectedOption) =>
                        setFieldValue("source", selectedOption.value)
                      }
                      placeholder="Select an option"
                      classNamePrefix="select"
                    />
                    <ErrorMessage
                      name="source"
                      component="div"
                      className="text-red-500"
                    />
                  </div>

                  <div className="my-6">
                    <Button disabled={!(isValid && dirty)} type="submit" onClick={() => {}} onSuccess={() => {}}>
                      Create Account
                    </Button>
                  </div>

                  <p className="text-center">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-500">
                      Sign In
                    </Link>
                  </p>
                  <div className="my-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-lead text-center text-[16px]">
                      By clicking on “Create Account”, you agree to our{" "}
                      <Link to="/terms" className="text-sm text-green-600 text-[16px]">
                        Terms & Conditions.
                      </Link>
                    </p>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      <div className="hidden md:flex bg-gradient-to-r from-blue-400 to-blue-600 rounded-tl-lg rounded-bl-lg shadow-lg min-h-screen w-full flex items-center justify-center">
        <p className="p-8 text-white text-4xl md:text-5xl font-semibold text-center">
          Purchase Utility Bills at Competitive Prices!
        </p>
      </div>
    </div>
  );
};

export default Create;