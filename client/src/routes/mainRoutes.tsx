import { lazy } from "react";
import AuthGuard from "../utils/guard";
import MainLayout from "../layout/mainLayout";
import Dashboard from "../pages/dashboard";
import Transactions from "../pages/transactions";
import Wallet from "../pages/wallet";
import Settings from "../pages/settings";
import Referral from "../pages/referral";
import Utilities from "../pages/utilities";
import Confirmation from "../pages/wallet/confirmation";
import Rank from "../pages/rank";
import Support from "../pages/support";

const MainRoutes = {
  path: "/",
  element: (
    <AuthGuard tokenKey="ohtopup-token">
      <MainLayout />
    </AuthGuard>
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
    {
      path: "/rank",
      element: <Rank />,
    },
    {
      path: "/support",
      element: <Support />,
    },
  ],
};

export default MainRoutes;
