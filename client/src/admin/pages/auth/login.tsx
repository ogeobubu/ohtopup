import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field, FieldProps } from "formik";
import { FiArrowRight, FiEye, FiEyeOff, FiMoon, FiSun } from "react-icons/fi";
import * as Yup from "yup";
import { loginAdmin } from "../../api";

type LoginProps = { darkMode: boolean; toggleDarkMode: () => void };
const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email address.").required("Enter your email address."),
  password: Yup.string().required("Enter your password."),
});

const fieldClass = "block min-h-[46px] w-full min-w-0 max-w-full rounded-control border border-line bg-paper px-3 py-[10px] text-sm text-ink outline-none focus:outline-2 focus:outline-accent focus:outline-offset-1 aria-[invalid=true]:border-danger";
const labelClass = "mb-[7px] block text-xs font-mediumish text-ink";
const errorClass = "mt-[5px] text-[11px] text-danger";

export default function Login({ darkMode, toggleDarkMode }: LoginProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  useEffect(() => {
    if (localStorage.getItem('ohtopup-admin-token')) navigate('/admin/dashboard', { replace: true });
  }, [navigate]);
  const mutation = useMutation({ mutationFn: loginAdmin });

  return (
    <div
      className="flex min-h-dvh flex-col overflow-wrap-anywhere bg-bg text-ink"
      style={{ '--ot-accent': '#247366', '--ot-tint': '#edf5f2' } as CSSProperties}
    >
      <header className="flex items-center justify-between bg-admin-chrome p-4 nav:p-5 nav:px-9">
        <div className="flex items-center justify-between px-3">
          <Link to="/admin/login" className="flex items-center gap-2.5 text-[23px] font-semibold tracking-[-1px] text-[#f2f6f7] no-underline">
            ohtopup
            <span className="rounded-[3px] border border-admin-ring px-[5px] py-1 text-[8px] font-medium tracking-[1.2px] text-[#b3c9c4]">ADMIN</span>
          </Link>
        </div>
        <button
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-admin-text hover:bg-admin-active"
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <FiSun className="h-[18px] w-[18px]" /> : <FiMoon className="h-[18px] w-[18px]" />}
        </button>
      </header>
      <main className="flex flex-1 items-center justify-center p-5 nav:p-12">
        <section className="w-full max-w-[420px] rounded-lg border border-line bg-paper p-7 box-border nav:p-9" aria-labelledby="admin-login-title">
          <span className="mb-4 block text-[9px] tracking-[1.5px] text-accent">OPERATIONS WORKSPACE</span>
          <h1 id="admin-login-title" className="mb-2.5 text-[27px] font-mediumish leading-tight tracking-[-0.7px]">Admin sign in</h1>
          <p className="mb-[30px] text-[13px] leading-relaxed text-muted">Sign in to manage your platform.</p>
          <Formik initialValues={{ email: "", password: "" }} validationSchema={validationSchema}
            onSubmit={async (values) => {
              setLoginError("");
              try {
                const data = await mutation.mutateAsync(values);
                if (!data.token) { setLoginError("Sign in failed. Please try again."); return; }
                localStorage.setItem('ohtopup-admin-token', data.token);
                navigate('/admin/dashboard', { replace: true });
              } catch (error) {
                setLoginError(error instanceof Error ? error.message : "Couldn’t sign in. Check your details and try again.");
              }
            }}>
            {({ isSubmitting }) => (
              <Form noValidate>
                <Field name="email">{({ field, meta }: FieldProps) => (
                  <div className="mb-5">
                    <label className={labelClass} htmlFor="admin-email">Email address</label>
                    <input {...field} id="admin-email" className={fieldClass} type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="you@company.com" aria-invalid={Boolean(meta.touched && meta.error)} aria-describedby={meta.touched && meta.error ? 'admin-email-error' : undefined} />
                    {meta.touched && meta.error && <p className={errorClass} id="admin-email-error">{meta.error}</p>}
                  </div>
                )}</Field>
                <Field name="password">{({ field, meta }: FieldProps) => (
                  <div className="mb-5">
                    <label className={labelClass} htmlFor="admin-password">Password</label>
                    <div className="relative">
                      <input {...field} id="admin-password" className={`${fieldClass} pr-[46px]`} type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-invalid={Boolean(meta.touched && meta.error)} aria-describedby={meta.touched && meta.error ? 'admin-password-error' : undefined} />
                      <button
                        type="button"
                        className="absolute right-[3px] top-[3px] inline-flex min-h-11 min-w-11 items-center justify-center rounded text-muted hover:bg-tint"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff className="h-[18px] w-[18px]" /> : <FiEye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>
                    {meta.touched && meta.error && <p className={errorClass} id="admin-password-error">{meta.error}</p>}
                  </div>
                )}</Field>
                {loginError && <p className="mb-4 leading-relaxed text-danger" role="alert">{loginError}</p>}
                <button
                  className="mt-1 flex min-h-[46px] w-full items-center justify-center gap-3 rounded-md border border-transparent bg-admin-teal px-[19px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-admin-teal-hover disabled:cursor-wait disabled:opacity-50"
                  type="submit"
                  disabled={isSubmitting || mutation.isPending}
                >
                  {isSubmitting ? <span role="status">Signing in…</span> : <>Sign in <FiArrowRight /></>}
                </button>
              </Form>
            )}
          </Formik>
          <div className="mt-7 border-t border-line pt-[22px] text-[11px] leading-[1.8] text-muted">
            Looking for your personal account?{' '}
            <Link className="mt-1 flex items-center gap-2 text-accent hover:underline" to="/login">
              Customer sign in <FiArrowRight />
            </Link>
          </div>
        </section>
      </main>
      <footer className="p-5 pb-6 text-center text-[10px] text-muted">OhTopUp · Administration</footer>
    </div>
  );
}
