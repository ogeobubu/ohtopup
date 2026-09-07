import { useEffect, useState } from "react";
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

export default function Login({ darkMode, toggleDarkMode }: LoginProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  useEffect(() => {
    if (localStorage.getItem('ohtopup-admin-token')) navigate('/admin/dashboard', { replace: true });
  }, [navigate]);
  const mutation = useMutation({ mutationFn: loginAdmin });

  return <div className={`ot-admin ot-admin-login${darkMode ? ' dark' : ''}`}>
    <header className="ot-admin-login-header">
      <div className="ot-admin-brand"><Link to="/admin/login">ohtopup<span>ADMIN</span></Link></div>
      <button className="ot-icon-button" onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <FiSun /> : <FiMoon />}</button>
    </header>
    <main className="ot-admin-login-main">
      <section className="ot-admin-login-card" aria-labelledby="admin-login-title">
        <span className="ot-admin-login-eyebrow">OPERATIONS WORKSPACE</span>
        <h1 id="admin-login-title">Admin sign in</h1>
        <p>Sign in to manage your platform.</p>
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
          {({ isSubmitting }) => <Form noValidate>
            <Field name="email">{({ field, meta }: FieldProps) => <div className="ot-admin-login-field">
              <label className="ot-field-label" htmlFor="admin-email">Email address</label>
              <input {...field} id="admin-email" className="ot-field" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="you@company.com" aria-invalid={Boolean(meta.touched && meta.error)} aria-describedby={meta.touched && meta.error ? 'admin-email-error' : undefined} />
              {meta.touched && meta.error && <p className="ot-field-error" id="admin-email-error">{meta.error}</p>}
            </div>}</Field>
            <Field name="password">{({ field, meta }: FieldProps) => <div className="ot-admin-login-field">
              <label className="ot-field-label" htmlFor="admin-password">Password</label>
              <div className="ot-admin-password"><input {...field} id="admin-password" className="ot-field" type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-invalid={Boolean(meta.touched && meta.error)} aria-describedby={meta.touched && meta.error ? 'admin-password-error' : undefined} /><button type="button" className="ot-icon-button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div>
              {meta.touched && meta.error && <p className="ot-field-error" id="admin-password-error">{meta.error}</p>}
            </div>}</Field>
            {loginError && <p className="ot-field-error ot-admin-login-error" role="alert">{loginError}</p>}
            <button className="ot-button ot-admin-login-submit" type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting ? <span role="status">Signing in…</span> : <>Sign in <FiArrowRight /></>}</button>
          </Form>}
        </Formik>
        <div className="ot-admin-login-customer">Looking for your personal account? <Link to="/login">Customer sign in <FiArrowRight /></Link></div>
      </section>
    </main>
    <footer className="ot-admin-login-footer">OhTopUp · Administration</footer>
  </div>;
}
