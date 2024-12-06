import { lazy } from "react";
import AuthGuard from "../utils/guard";
import MainLayout from "../admin/layout/mainLayout";
import Dashboard from "../admin/pages/dashboard";
import Wallet from "../admin/pages/wallet";
import Referral from "../admin/pages/referral";
import UtilityTransactions from "../admin/pages/transactions";
import UserManagement from "../admin/pages/users";
import Settings from "../admin/pages/settings";
import Waitlist from "../admin/pages/waitlist";
import Utilities from "../admin/pages/utilities";

const AdminRoutes = {
  path: "/admin",
  element: (
    <AuthGuard tokenKey="ohtopup-admin-token">
      <MainLayout />
    </AuthGuard>
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
    {
      path: "waitlist",
      element: <Waitlist />,
    },
    {
      path: "utilities",
      element: <Utilities />,
    },
  ],
};

export default AdminRoutes;
