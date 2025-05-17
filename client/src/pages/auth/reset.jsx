import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Logo from "../../components/ui/logo";
import Button from "../../components/ui/forms/button";
import Textarea from "../../components/ui/forms/input";
import { resetUser, resendResetCodeUser } from "../../api";

const Reset = ({ darkMode }) => {
  const emailStorage = JSON.parse(localStorage.getItem("ohtopup-create")) || null;
  const inputRefs = useRef([]);

  useEffect(() => {
    const inputFields = inputRefs.current;

    inputFields.forEach((input, index) => {
      input.addEventListener("input", (event) => {
        if (event.target.value.length === 1 && index < inputFields.length - 1) {
          inputFields[index + 1].focus();
        }
      });
    });

    return () => {
      inputFields.forEach((input) => {
        input?.removeEventListener("input", () => {});
      });
    };
  }, []);

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

  return (
    <div className="flex md:flex-row justify-between">
      <div className="w-full py-0 md:py-4">
        <div className="max-w-md flex justify-center flex-col w-auto m-auto space-y-6">
          <Logo className="mx-auto w-auto" darkMode={darkMode} />
          <div className="flex justify-center flex-col gap-3 px-2 md:px-12">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              Reset Password
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your confirmation code to reset your password.
            </p>
            <Formik
              initialValues={{ otp: "", newPassword: "" }}
              validationSchema={validationSchema}
              onSubmit={(values, { resetForm }) => {
                const code = inputRefs.current.map((input) => input.value).join("");
                mutation.mutate(
                  {
                    email: emailStorage?.email || "ogeobubu@gmail.com",
                    otp: code,
                    newPassword: values.newPassword,
                  },
                  {
                    onSettled: () => {
                      resetForm();
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
                          focus:outline-none focus:border-blue-600`}
                        maxLength="1"
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
                      <Textarea
                        type="password"
                        label="New Password"
                        {...field}
                        error={meta.touched && meta.error ? meta.error : undefined}
                      />
                    )}
                  </Field>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await resendResetCodeUser({
                          email: emailStorage?.email || "ogeobubu@gmail.com",
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
                    <Button type="submit" disabled={isSubmitting}>
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

      <div className="hidden md:flex bg-gradient-to-r from-blue-400 to-blue-600 rounded-tl-lg rounded-bl-lg shadow-lg min-h-screen w-full flex items-center justify-center">
        <p className="p-8 text-white text-4xl md:text-5xl font-semibold text-center">
          Purchase Utility Bills at Competitive Prices!
        </p>
      </div>
    </div>
  );
};

export default Reset;