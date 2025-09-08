import { useRoutes, Navigate } from "react-router-dom";
import Landing from "../pages/landing/home";
import About from "../pages/landing/about";
import Pricing from "../pages/landing/pricing";
import Terms from "../pages/landing/terms";
import Unsubscribe from "../pages/unsubscribe";
import Create from "../pages/auth/create";
import Verify from "../pages/auth/verify";
import Login from "../pages/auth/login";
import Forgot from "../pages/auth/forgot";
import Reset from "../pages/auth/reset";
import OAuthCallback from "../pages/auth/callback";
import MainRoutes from "./mainRoutes";
import AdminRoutes from "./adminRoutes";
import AdminLogin from "../admin/pages/auth/login";

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
    ...userRoutes,
    {
      path: "/admin",
      element: isLoginAdmin ? <Navigate to="/admin/dashboard" /> : <AdminLogin darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      ,
    },
    {
      path: "/admin/*",
      element: AdminRoutes.element,
      children: AdminRoutes.children,
    },
    {
      path: MainRoutes.path,
      element: MainRoutes.element,
      children: MainRoutes.children,
    },
    {
      path: "*",
      element: <Navigate to="/login" />,
    },
  ]);
}