import { useRoutes } from "react-router-dom";
import Landing from "../pages/landing";
import Create from "../pages/auth/create";
import Verify from "../pages/auth/verify";
import Login from "../pages/auth/login";
import Forgot from "../pages/auth/forgot";
import Reset from "../pages/auth/reset";
import MainRoutes from "./mainRoutes";

export default function ThemeRoutes({ darkMode, toggleDarkMode }) {
  return useRoutes([
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
    MainRoutes,
  ]);
}
