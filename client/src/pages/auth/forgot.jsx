import React from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Logo from "../../components/ui/logo";
import Textarea from "../../components/ui/forms/input";
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
    <div className="flex md:flex-row justify-between">
      <div className="w-full py-0 md:py-4">
        <div className="max-w-md flex justify-center flex-col w-auto m-auto w-full space-y-6">
          <Logo className="mx-auto w-auto" darkMode={darkMode} />
          <div className="flex justify-center w-auto flex-col gap-3 px-2 md:px-12">
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
                    as={Textarea}
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

      <div className="hidden md:flex bg-gradient-to-r from-blue-400 to-blue-600 rounded-tl-lg rounded-bl-lg shadow-lg min-h-screen w-full flex items-center justify-center">
        <p className="p-8 text-white text-4xl md:text-5xl font-semibold text-center">
          Purchase Utility Bills at Competitive Prices!
        </p>
      </div>
    </div>
  );
};

export default Forgot;