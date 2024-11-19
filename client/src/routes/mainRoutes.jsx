import { lazy } from "react";

// import AuthGuard from "../utils/route-guard/AuthGuard";
import MainLayout from "../layout/mainLayout";
// import Loadable from "../ui-component/Loadable";
import Dashboard from "../pages/dashboard"
import Wallet from "../pages/wallet"
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
      path: "/wallet",
      element: <Wallet />,
    },
    {
      path: "/settings",
      element: <Settings />,
    },
  ],
};

export default MainRoutes;
