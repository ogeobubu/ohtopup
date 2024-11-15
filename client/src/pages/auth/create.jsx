import React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Select from "react-select";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Link } from "react-router-dom";
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
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Error creating account";
      toast.error(errorMessage);
    },
  });

  const validationSchema = Yup.object().shape({
    username: Yup.string().required("Username is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phoneNumber: Yup.string().required("Phone number is required"),
    referralCode: Yup.string().notRequired(),
    password: Yup.string().required("Password is required"),
    source: Yup.string().required("Source is required"),
  });

  return (
    <div className="flex md:flex-row justify-between">
      <div className="w-full py-0 md:py-4 h-screen overflow-y-auto">
        <div className="max-w-md flex justify-center flex-col w-auto m-auto w-full space-y-4">
          <Logo className="mx-auto w-auto" darkMode={darkMode} />
          <div className="flex justify-center w-auto flex-col gap-3 px-2 md:px-12">
            <h3 className="text-lg font-semibold">Welcome Back,</h3>
            <p className="text-gray-600">
              Kindly enter your details to log in.
            </p>
            <Formik
              initialValues={{
                username: "",
                email: "",
                phoneNumber: "",
                referralCode: "",
                password: "",
                source: "",
              }}
              validationSchema={validationSchema}
              onSubmit={(values, { resetForm }) => {
                localStorage.setItem(
                  "ohtopup-create",
                  JSON.stringify({
                    username: values.username,
                    email: values.email,
                  })
                );
                mutation.mutate(values);
                resetForm();
              }}
            >
              {({ setFieldValue, values, isValid, dirty }) => (
                <Form>
                  <Field name="username">
                    {({ field, meta }) => (
                      <Textarea
                        error={meta.touched && meta.error}
                        name={field.name}
                        {...field}
                        label="Username"
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
                    <Button disabled={!(isValid && dirty)} type="submit">
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
                    <p className="text-sm text-gray-500 text-lead text-center text-[16px]">
                      By clicking on “Create Account”, you have agreed to our{" "}
                      <span className="text-sm text-green-600 text-[16px]">
                        Terms & Conditions.
                      </span>
                    </p>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      <div className="hidden md:flex bg-gradient-to-r from-blue-400 to-blue-600 rounded-tl-lg rounded-bl-lg shadow-lg min-h-screen w-full flex items-center justify-center">
        <p className="p-8 text-white text-5xl font-semibold text-center">
          Purchase Utility Bills for a Cheap Price Here
        </p>
      </div>
    </div>
  );
};

export default Create;
