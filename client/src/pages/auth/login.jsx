import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup"; // For validation
import Logo from "../../components/ui/logo";
import Textarea from "../../components/ui/forms/input";
import Button from "../../components/ui/forms/button";
import { loginUser } from "../../api";

const storeToken = (token) => {
  localStorage.setItem('ohtopup-token', token);
};

const Login = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      storeToken(data.token)
      toast.success("Login successful!");
      navigate("/dashboard")
      console.log("Login successful", data);
    },
    onError: (error) => {
      toast.error("Login failed: " + error);
    },
  });

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email address").required("Required"),
    password: Yup.string().required("Required"),
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
              initialValues={{ email: "", password: "" }}
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
                  <Field name="email">
                    {({ field, meta }) => (
                      <Textarea
                        type="email"
                        label="Email Address"
                        {...field}
                        error={
                          meta.touched && meta.error ? meta.error : undefined
                        }
                      />
                    )}
                  </Field>
                  <Field name="password">
                    {({ field, meta }) => (
                      <Textarea
                        type="password"
                        label="Password"
                        {...field}
                        error={
                          meta.touched && meta.error ? meta.error : undefined
                        }
                      />
                    )}
                  </Field>
                  <Link
                    className="text-blue-500 hover:text-blue-700 focus:text-blue-700 underline font-semibold"
                    to="/forgot"
                  >
                    Forgot Password
                  </Link>
                  <div className="my-3">
                    <Button
                      type="submit"
                      disabled={
                        !(isValid && dirty) ||
                        isSubmitting ||
                        mutation.isLoading
                      }
                    >
                      {isSubmitting || mutation.isLoading
                        ? "Logging in..."
                        : "Login"}
                    </Button>
                  </div>
                  <p className="text-center">
                    Don't have an account?{" "}
                    <Link to="/create" className="text-blue-500">
                      Create Account
                    </Link>
                  </p>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      <div className="hidden md:flex bg-gradient-to-r from-blue-400 to-blue-600 rounded-tl-lg rounded-bl-lg shadow-lg min-h-screen w-full flex items-center justify-center">
        <p className="p-8 text-white text-5xl font-semibold text-center ">
          Purchase Utility Bills for a Cheap Price Here
        </p>
      </div>
    </div>
  );
};

export default Login;
