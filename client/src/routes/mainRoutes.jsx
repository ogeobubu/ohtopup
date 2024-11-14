import { lazy } from "react";

// import AuthGuard from "../utils/route-guard/AuthGuard";
import MainLayout from "../layout/mainLayout";
// import Loadable from "../ui-component/Loadable";
import Dashboard from "../pages/dashboard"
import Settings from "../pages/settings"

const MainRoutes = {
  path: "/",
  element: (
    <MainLayout />
  ),
  children: [
    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/settings",
      element: <Settings />,
    },
  ],
};

export default MainRoutes;
