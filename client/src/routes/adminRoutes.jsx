import { lazy } from "react";

// import AuthGuard from "../utils/route-guard/AuthGuard";
import MainLayout from "../admin/layout/mainLayout";
// import Loadable from "../ui-component/Loadable";
import Dashboard from "../admin/pages/dashboard"
import Wallet from "../admin/pages/wallet"
import Referral from "../admin/pages/referral"
import UtilityTransactions from "../admin/pages/transactions"
import UserManagement from "../admin/pages/users"
import Settings from "../admin/pages/settings"

const AdminRoutes = {
  path: "/admin",
  element: (
    <MainLayout />
  ),
  children: [
    {
      path: "dashboard",
      element: <Dashboard />,
    },
    {
      path: "transactions",
      element: <UtilityTransactions />,
    },
    {
      path: "users",
      element: <UserManagement />,
    },
    {
      path: "wallet",
      element: <Wallet />,
    },
    {
      path: "referral",
      element: <Referral />,
    },
    {
      path: "settings",
      element: <Settings />,
    },
  ],
};

export default AdminRoutes;
