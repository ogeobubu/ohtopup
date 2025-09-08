import { useSelector } from "react-redux";
import AuthGuard from "../utils/guard";
import MainLayout from "../admin/layout/mainLayout";
import Dashboard from "../admin/pages/dashboard";
import Wallet from "../admin/pages/wallet";
import Referral from "../admin/pages/referral";
import UtilityTransactions from "../admin/pages/transactions";
import AdminTransactionDetail from "../admin/pages/TransactionDetail";
import UserManagement from "../admin/pages/users";
import Settings from "../admin/pages/settings";
import Waitlist from "../admin/pages/waitlist";
import Utilities from "../admin/pages/utilities";
import Support from "../admin/pages/support";
import Newsletter from "../admin/pages/newsletter";
import AdminRanking from "../admin/pages/ranking";
import AdminDiceGame from "../admin/pages/dice";
import ProviderManagement from "../admin/pages/providers";
import SystemLogs from "../admin/pages/logs";

const AdminTransactionDetailWrapper = () => {
  const isDarkMode = useSelector((state) => state.theme && state.theme.isDarkMode);
  return <AdminTransactionDetail isDarkMode={isDarkMode} />;
};

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
      path: "transactions/:requestId",
      element: <AdminTransactionDetailWrapper />,
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
    {
      path: "support",
      element: <Support />,
    },
    {
      path: "newsletter",
      element: <Newsletter />,
    },
    {
      path: "ranking",
      element: <AdminRanking />,
    },
    {
      path: "dice",
      element: <AdminDiceGame />,
    },
    {
      path: "providers",
      element: <ProviderManagement />,
    },
    {
      path: "logs",
      element: <SystemLogs />,
    },
  ],
};

export default AdminRoutes;
