import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Logo from "../../components/ui/logo";
import Button from "../../components/ui/forms/button";
import FormInput from "../../components/ui/forms/input";
import { resetUser, resendResetCodeUser } from "../../api";

const Reset = ({ darkMode }) => {
  const emailStorage = JSON.parse(localStorage.getItem("ohtopup-forgot")) || null;
  const inputRefs = useRef([]);

  // Redirect to forgot password if no email is stored
  React.useEffect(() => {
    if (!emailStorage?.email) {
      window.location.href = "/forgot";
    }
  }, [emailStorage]);

  useEffect(() => {
    const inputFields = inputRefs.current;

    inputFields.forEach((input, index) => {
      const handleInput = (event) => {
        if (event.target.value.length === 1 && index < inputFields.length - 1) {
          inputFields[index + 1].focus();
        }
      };

      input.addEventListener("input", handleInput);
      
      return () => {
        input.removeEventListener("input", handleInput);
      };
    });
  }, []);

  const handlePaste = (event) => {
    const pastedData = event.clipboardData.getData("text").slice(0, 4);
    const inputs = pastedData.split("");

    inputs.forEach((value, i) => {
      if (i < inputRefs.current.length) {
        inputRefs.current[i].value = value;
        inputRefs.current[i].dispatchEvent(new Event("input")); // Trigger input event
      }
    });

    event.preventDefault();
    inputRefs.current[Math.min(inputs.length, inputRefs.current.length - 1)].focus();
  };

  const validationSchema = Yup.object().shape({
    otp: Yup.string()
      .length(4, "Code must be 4 digits")
      .required("Code is required"),
    newPassword: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("New password is required"),
  });

  const mutation = useMutation({
    mutationFn: resetUser,
    onSuccess: () => {
      toast.success("Reset successful! Redirecting to login...");
      window.location.href = "/login";
    },
    onError: (error) => {
      toast.error("Error resetting password: " + error.message);
    },
  });

  // Don't render if no email is stored
  if (!emailStorage?.email) {
    return null;
  }

  return (
    <div className={`flex min-h-dvh flex-col justify-between overflow-wrap-anywhere md:flex-row ${darkMode ? 'bg-bg text-ink' : 'bg-bg text-ink'}`}>
      <div className="flex min-w-0 flex-col justify-center bg-paper px-6 py-[30px] xs:px-8 nav:px-[clamp(24px,6vw,95px)] nav:py-[45px]">
        <div className="mx-auto my-5 w-full max-w-auth min-w-0 nav:my-auto">
          <Logo className="mx-auto mb-11 w-auto" darkMode={darkMode} href="/" />
          <div className="flex flex-col justify-center gap-3 px-2 md:px-12">
            <h3 className="text-xl font-mediumish tracking-[-0.8px] nav:text-[30px]">
              Reset Password
            </h3>
            <p className="text-sm text-muted">
              Enter your confirmation code to reset your password.
            </p>
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Note:</strong>
              <span className="block sm:inline"> If you don't see the email in your inbox, please check your spam folder.</span>
            </div>
            <Formik
              initialValues={{ otp: "", newPassword: "" }}
              validationSchema={validationSchema}
              onSubmit={(values, { resetForm }) => {
                const code = inputRefs.current.map((input) => input.value).join("");
                mutation.mutate(
                  {
                    email: emailStorage?.email,
                    otp: code,
                    newPassword: values.newPassword,
                  },
                  {
                    onSettled: () => {
                      resetForm();
                      inputRefs.current.forEach(input => input.value = "");
                    },
                  }
                );
              }}
            >
              {({ isSubmitting, setFieldValue, errors, touched }) => (
                <Form>
                  <label className="block text-gray-500 mb-2">Enter OTP</label>
                  <div className="flex gap-2 items-center justify-between w-full mb-5">
                    {[...Array(4)].map((_, index) => (
                      <input
                        key={index}
                        ref={(input) => (inputRefs.current[index] = input)}
                        type="text"
                        className={`w-12 md:w-20 h-12 border rounded-md text-center font-bold text-2xl 
                          ${errors.otp && touched.otp ? "border-red-500" : "border-blue-500"} 
                          focus:outline-none focus:border-blue-600 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
                        maxLength="1"
                        onPaste={index === 0 ? handlePaste : undefined} // Only attach to the first input
                        onChange={(e) => {
                          setFieldValue(
                            "otp",
                            inputRefs.current.map((input) => input.value).join("")
                          );

                          if (e.target.value.length === 1 && index < inputRefs.current.length - 1) {
                            inputRefs.current[index + 1].focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && e.target.value.length === 0 && index > 0) {
                            inputRefs.current[index - 1].focus();
                          }
                        }}
                        onFocus={(e) => {
                          e.target.select();
                        }}
                      />
                    ))}
                  </div>
                  <ErrorMessage name="otp" component="div" className="text-red-500 mb-3" />
                  <Field name="newPassword">
                    {({ field, meta }) => (
                      <FormInput
                        type="password"
                        label="New Password"
                        {...field}
                        error={meta.touched && meta.error ? meta.error : undefined}
                        className={darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}
                      />
                    )}
                  </Field>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await resendResetCodeUser({
                          email: emailStorage?.email,
                        });
                        toast.success(response.message);
                      } catch (error) {
                        toast.error("Error resending code: " + error.message);
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700 focus:text-blue-700 underline font-semibold"
                  >
                    Resend Code
                  </button>
                  <div className="my-3">
                    <Button type="submit" onClick={() => {}} onSuccess={() => {}} disabled={isSubmitting}>
                      Reset
                    </Button>
                  </div>
                  <Link
                    className="flex justify-center items-center text-blue-500 hover:text-blue-700 focus:text-blue-700 text-center"
                    to="/forgot"
                  >
                    Back to Forgot
                  </Link>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      <aside className="hidden min-w-0 flex-col justify-center bg-night px-10 py-10 text-white nav:flex nav:px-[50px] nav:py-20 max-[900px]:hidden">
        <span className="text-[10px] font-semiboldish tracking-[1.7px] text-[#bdc9d5]">EVERYDAY ESSENTIALS</span>
        <h2 className="my-[22px] text-[clamp(36px,4vw,57px)] font-thin leading-tight tracking-[-2px]">A little less admin.<br />A lot more life.</h2>
        <p className="max-w-[330px] text-[15px] leading-[1.8] text-[#bdc9d5]">Data, airtime and household bills. Take care of the everyday, all in one place.</p>
        <small className="mt-[70px] text-[10px] text-[#bdc9d5]">OhTopUp · Made for everyday life in Nigeria.</small>
      </aside>
    </div>
  );
};

export default Reset;