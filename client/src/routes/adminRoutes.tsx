import { lazy } from "react";
import { useSelector } from "react-redux";
import AuthGuard from "../utils/guard";
import MainLayout from "../admin/layout/mainLayout";
import RouteError from "../components/ui/RouteError";

const Dashboard = lazy(() => import("../admin/pages/dashboard"));
const Wallet = lazy(() => import("../admin/pages/wallet"));
const Referral = lazy(() => import("../admin/pages/referral"));
const UtilityTransactions = lazy(() => import("../admin/pages/transactions"));
const AdminTransactionDetail = lazy(() => import("../admin/pages/TransactionDetail"));
const UserManagement = lazy(() => import("../admin/pages/users"));
const Settings = lazy(() => import("../admin/pages/settings"));
const Waitlist = lazy(() => import("../admin/pages/waitlist"));
const Utilities = lazy(() => import("../admin/pages/utilities"));
const Support = lazy(() => import("../admin/pages/support"));
const Newsletter = lazy(() => import("../admin/pages/newsletter"));
const AdminRanking = lazy(() => import("../admin/pages/ranking"));
const AdminDiceGame = lazy(() => import("../admin/pages/dice"));
const AdminBetDiceGame = lazy(() => import("../admin/pages/betDice"));
const ProviderManagement = lazy(() => import("../admin/pages/providers"));
const SystemLogs = lazy(() => import("../admin/pages/system-logs"));
const TutorialManagement = lazy(() => import("../admin/pages/tutorials"));
const PaymentOperations = lazy(() => import("../admin/pages/payment-operations"));

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
  errorElement: <RouteError />,
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
      path: "payment-operations",
      element: <PaymentOperations />,
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
      path: "bet-dice",
      element: <AdminBetDiceGame />,
    },
    {
      path: "providers",
      element: <ProviderManagement />,
    },
    {
      path: "logs",
      element: <SystemLogs />,
    },
    {
      path: "tutorials",
      element: <TutorialManagement />,
    },
  ],
};

export default AdminRoutes;
