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
    <div className="ot-auth">
      <div className="ot-auth-form">
        <div className="ot-auth-inner">
          <Logo className="mx-auto w-auto" darkMode={darkMode} href="/" />
          <div className="ot-auth-fields">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              Forgot Password
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
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

      <aside className="ot-auth-aside"><span className="ot-eyebrow">EVERYDAY ESSENTIALS</span><h2>A little less admin.<br />A lot more life.</h2><p>Data, airtime and household bills. Take care of the everyday, all in one place.</p><small>OhTopUp · Made for everyday life in Nigeria.</small></aside>
    </div>
  );
};

export default Forgot;