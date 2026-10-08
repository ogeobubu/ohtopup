import { lazy } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import MainRoutes from "./mainRoutes";
import AdminRoutes from "./adminRoutes";

const Landing = lazy(() => import("../pages/landing/home"));
const About = lazy(() => import("../pages/landing/about"));
const Pricing = lazy(() => import("../pages/landing/pricing"));
const Terms = lazy(() => import("../pages/landing/terms"));
const Tutorial = lazy(() => import("../pages/landing/tutorial"));
const TutorialDetail = lazy(() => import("../pages/TutorialDetail"));
const Unsubscribe = lazy(() => import("../pages/unsubscribe"));
const Create = lazy(() => import("../pages/auth/create"));
const Verify = lazy(() => import("../pages/auth/verify"));
const Login = lazy(() => import("../pages/auth/login"));
const Forgot = lazy(() => import("../pages/auth/forgot"));
const Reset = lazy(() => import("../pages/auth/reset"));
const OAuthCallback = lazy(() => import("../pages/auth/callback"));
const AdminLogin = lazy(() => import("../admin/pages/auth/login"));

export default function ThemeRoutes({ darkMode, toggleDarkMode }) {
  const isLogin = localStorage.getItem("ohtopup-token");
  const isLoginAdmin = localStorage.getItem("ohtopup-admin-token");

  const userRoutes = [
    {
      path: "/",
      element: isLogin ? <Navigate to="/dashboard" /> : <Landing darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/about",
      element: isLogin ? <Navigate to="/dashboard" /> : <About darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/pricing",
      element: isLogin ? <Navigate to="/dashboard" /> : <Pricing darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/terms",
      element: isLogin ? <Navigate to="/dashboard" /> : <Terms darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/tutorials",
      element: <Tutorial darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/tutorial/:id",
      element: <TutorialDetail darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/create",
      element: isLogin ? <Navigate to="/dashboard" /> : <Create darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/verify",
      element: isLogin ? <Navigate to="/dashboard" /> : <Verify darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/login",
      element: isLogin ? <Navigate to="/dashboard" /> : <Login darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/forgot",
      element: isLogin ? <Navigate to="/dashboard" /> : <Forgot darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/reset",
      element: isLogin ? <Navigate to="/dashboard" /> : <Reset darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/unsubscribe",
      element: <Unsubscribe />,
    },
    {
      path: "/auth/callback",
      element: <OAuthCallback />,
    },
  ];

  return useRoutes([
    {
      path: "/admin/login",
      element: <AdminLogin darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/admin",
      element: isLoginAdmin ? <Navigate to="/admin/dashboard" /> : <Navigate to="/admin/login" />,
    },
    {
      path: "/admin/*",
      element: AdminRoutes.element,
      errorElement: AdminRoutes.errorElement,
      children: AdminRoutes.children,
    },
    ...userRoutes,
    {
      path: MainRoutes.path,
      element: MainRoutes.element,
      errorElement: MainRoutes.errorElement,
      children: MainRoutes.children,
    },
    {
      path: "*",
      element: <Navigate to="/login" />,
    },
  ]);
}
