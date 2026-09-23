import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import Logo from "../../components/ui/logo";
import Button from "../../components/ui/forms/button";
import { verifyUser, resendCodeUser } from "../../api";

const Verify = ({ darkMode }) => {
  const emailStorage = JSON.parse(localStorage.getItem("ohtopup-create")) || null;
  const inputRefs = useRef([]);

  useEffect(() => {
    const inputFields = inputRefs.current;

    inputFields.forEach((input, index) => {
      if (input) {
        const handleInput = (event) => {
          if (event.target.value.length === 1) {
            if (index < inputFields.length - 1) {
              inputFields[index + 1].focus();
            }
          }
        };

        input.addEventListener("input", handleInput);
        return () => {
          input.removeEventListener("input", handleInput);
        };
      }
    });
  }, []);

  const handlePaste = (event, index) => {
    const pastedData = event.clipboardData.getData("text").slice(0, 4);
    const inputs = pastedData.split("");

    inputs.forEach((value, i) => {
      if (index + i < inputRefs.current.length) {
        inputRefs.current[index + i].value = value;
        inputRefs.current[index + i].dispatchEvent(new Event("input")); // Trigger input event
      }
    });

    event.preventDefault();
    if (inputs.length > 0) {
      inputRefs.current[Math.min(index + inputs.length, inputRefs.current.length - 1)].focus();
    }
  };

  const validationSchema = Yup.object().shape({
    confirmationCode: Yup.string()
      .length(4, "Code must be 4 digits")
      .required("Code is required"),
  });

  const mutation = useMutation({
    mutationFn: verifyUser,
    onSuccess: () => {
      toast.success("Verification successful! Redirecting to login...");
      window.location.href = "/login";
    },
    onError: (error) => {
      toast.error("Error verifying code: " + error.message);
    },
  });

  return (
    <div className="flex min-h-dvh flex-col justify-between overflow-wrap-anywhere bg-bg text-ink md:flex-row">
      <div className="flex min-w-0 flex-col justify-center bg-paper px-6 py-[30px] xs:px-8 nav:px-[clamp(24px,6vw,95px)] nav:py-[45px]">
        <div className="mx-auto my-5 w-full max-w-auth min-w-0 nav:my-auto">
          <Logo className="mx-auto mb-11 w-auto" darkMode={darkMode} href="/" />
          <div>
            <h3 className="mb-2 text-xl font-mediumish tracking-[-0.8px] nav:text-[30px]">Verify Email</h3>
            <p className="mb-6 text-sm text-muted">
              Enter your confirmation code to verify your email address.
            </p>
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Note:</strong>
              <span className="block sm:inline"> If you don't see the email in your inbox, please check your spam folder.</span>
            </div>
            <Formik
              initialValues={{ confirmationCode: "" }}
              validationSchema={validationSchema}
              onSubmit={(values, { resetForm }) => {
                const code = inputRefs.current
                  .map((input) => input.value)
                  .join("");
                mutation.mutate(
                  { confirmationCode: code },
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
                  <div className="flex gap-2 items-center justify-between w-full mb-5">
                    {[...Array(4)].map((_, index) => {
                      const isError = errors.confirmationCode && touched.confirmationCode;

                      return (
                        <input
                          key={index}
                          ref={(input) => (inputRefs.current[index] = input)}
                          type="text"
                          className={`w-12 md:w-20 h-12 border rounded-md text-center font-bold text-2xl 
                            ${isError ? "border-red-500" : "border-blue-500"} 
                            focus:outline-none focus:border-blue-600 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
                          maxLength="1"
                          onPaste={(e) => handlePaste(e, index)}
                          onChange={(e) => {
                            setFieldValue(
                              "confirmationCode",
                              inputRefs.current
                                .map((input) => input.value)
                                .join("")
                            );

                            if (
                              e.target.value.length === 1 &&
                              index < inputRefs.current.length - 1
                            ) {
                              inputRefs.current[index + 1].focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Backspace" &&
                              e.target.value.length === 0 &&
                              index > 0
                            ) {
                              inputRefs.current[index - 1].focus();
                            }
                          }}
                          onFocus={(e) => {
                            e.target.select();
                          }}
                        />
                      );
                    })}
                  </div>
                  <ErrorMessage
                    name="confirmationCode"
                    component="div"
                    className="text-red-500 mb-3"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await resendCodeUser({
                          email: emailStorage ? emailStorage.email : "",
                        });
                        toast.success(response.message);
                      } catch (error) {
                        toast.error("Error verifying code: " + error.message);
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700 focus:text-blue-700 underline font-semibold"
                  >
                    Resend Code
                  </button>
                  <br />
                  <br />
                  <div className="my-3">
                    <Button type="submit" onClick={() => {}} onSuccess={() => {}} disabled={isSubmitting}>
                      Verify Code
                    </Button>
                  </div>
                  <Link
                    className="flex justify-center items-center text-blue-500 hover:text-blue-700 focus:text-blue-700 text-center"
                    to="/create"
                  >
                    Back to Create
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

export default Verify;