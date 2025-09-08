import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Logo from "../../components/ui/logo";
import Textarea from "../../components/ui/forms/input";
import Button from "../../components/ui/forms/button";
import { loginUser } from "../../api";

const storeToken = (token) => {
  localStorage.setItem('ohtopup-token', token);
};

const Login = ({ darkMode }) => {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      storeToken(data.token);
      toast.success("Login successful!");
      navigate("/dashboard");
    },
    onError: (error) => {
      const errorMessage = error?.message || "An unexpected error occurred.";
      toast.error("Login failed: " + errorMessage);
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
          <Logo href="/" className="mx-auto w-auto" darkMode={darkMode} />
          <div className="flex justify-center w-auto flex-col gap-3 px-2 md:px-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Welcome Back!
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Please enter your credentials to log in.
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
                    Forgot Password?
                  </Link>
                  <div className="my-3">
                    <Button
                      type="submit"
                      onClick={() => {}}
                      onSuccess={() => {}}
                      disabled={
                        !(isValid && dirty) ||
                        isSubmitting ||
                        mutation.isPending
                      }
                    >
                      {isSubmitting || mutation.isPending
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
        <p className="p-8 text-white text-5xl font-semibold text-center">
          Purchase Utility Bills at Competitive Prices!
        </p>
      </div>
    </div>
  );
};

export default Login;