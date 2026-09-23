import React from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Logo from "../../components/ui/logo";
import FormInput from "../../components/ui/forms/input";
import Button from "../../components/ui/forms/button";
import { forgotUser } from "../../api";

const Forgot = ({ darkMode }) => {
  const navigate = useNavigate();
  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
  });

  const mutation = useMutation({
    mutationFn: forgotUser,
    onSuccess: () => {
      toast.success("Password reset email sent!");
      navigate("/reset");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  return (
    <div className="grid min-h-dvh grid-cols-1 overflow-wrap-anywhere bg-bg text-ink nav:grid-cols-2">
      <div className="flex min-w-0 flex-col justify-center bg-paper px-6 py-[30px] xs:px-8 nav:px-[clamp(24px,6vw,95px)] nav:py-[45px]">
        <div className="mx-auto my-5 w-full max-w-auth min-w-0 nav:my-auto">
          <Logo className="mx-auto mb-11 w-auto" darkMode={darkMode} href="/" />
          <div>
            <h3 className="mb-2 text-xl font-mediumish tracking-[-0.8px] nav:text-[30px]">
              Forgot Password
            </h3>
            <p className="mb-6 text-sm text-muted">
              Enter your registered email to reset your password.
            </p>
            <Formik
              initialValues={{ email: "" }}
              validationSchema={validationSchema}
              onSubmit={(values, { resetForm }) => {
                // Store the email for the reset page
                localStorage.setItem("ohtopup-forgot", JSON.stringify({ email: values.email }));

                mutation.mutate(values, {
                  onSettled: () => {
                    resetForm();
                  },
                });
              }}
            >
              {({ isSubmitting, isValid, dirty }) => (
                <Form>
                  <Field
                    type="email"
                    name="email"
                    as={FormInput}
                    label="Email Address"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500"
                  />
                  <div className="my-3">
                    <Button
                      type="submit"
                      onClick={() => {}}
                      onSuccess={() => {}}
                      disabled={!(isValid && dirty) || isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Recover Password"}
                    </Button>
                  </div>
                  <Link
                    className="flex justify-center items-center text-blue-500 hover:text-blue-700 focus:text-blue-700 text-center"
                    to="/login"
                  >
                    Back to Login
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

export default Forgot;