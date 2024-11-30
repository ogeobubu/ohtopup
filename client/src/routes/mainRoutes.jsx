import { lazy } from "react";

// import AuthGuard from "../utils/route-guard/AuthGuard";
import MainLayout from "../layout/mainLayout";
// import Loadable from "../ui-component/Loadable";
import Dashboard from "../pages/dashboard"
import Transactions from "../pages/transactions"
import Wallet from "../pages/wallet"
import Settings from "../pages/settings"
import Referral from "../pages/referral"
import Utilities from "../pages/utilities"
import Confirmation from "../pages/wallet/confirmation"

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
      path: "/transactions",
      element: <Transactions />,
    },
    {
      path: "/wallet",
      element: <Wallet />,
    },
    {
      path: "/wallet/:id",
      element: <Confirmation />,
    },
    {
      path: "/referral",
      element: <Referral />,
    },
    {
      path: "/settings",
      element: <Settings />,
    },
    {
      path: "/utilities",
      element: <Utilities />,
    },
  ],
};

export default MainRoutes;
