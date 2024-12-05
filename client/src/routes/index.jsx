import { useRoutes, Navigate } from "react-router-dom";
import Landing from "../pages/landing";
import Create from "../pages/auth/create";
import Verify from "../pages/auth/verify";
import Login from "../pages/auth/login";
import Forgot from "../pages/auth/forgot";
import Reset from "../pages/auth/reset";
import MainRoutes from "./mainRoutes";
import AdminRoutes from "./adminRoutes";
import AdminLogin from "../admin/pages/auth/login";

export default function ThemeRoutes({ darkMode, toggleDarkMode }) {
  const userRoutes = [
    {
      path: "/",
      element: <Landing darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/create",
      element: <Create darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/verify",
      element: <Verify darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/login",
      element: <Login darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/forgot",
      element: <Forgot darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
    {
      path: "/reset",
      element: <Reset darkMode={darkMode} toggleDarkMode={toggleDarkMode} />,
    },
  ];

  return useRoutes([
    ...userRoutes,
    {
      path: "/admin",
      element: (
        <AdminLogin darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      ),
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
