import { lazy } from "react";
import AuthGuard from "../utils/guard";
import MainLayout from "../layout/mainLayout";
import RouteError from "../components/ui/RouteError";

const Dashboard = lazy(() => import("../pages/dashboard"));
const Transactions = lazy(() => import("../pages/transactions"));
const TransactionDetail = lazy(() => import("../pages/TransactionDetail"));
const Wallet = lazy(() => import("../pages/wallet"));
const Settings = lazy(() => import("../pages/settings"));
const Referral = lazy(() => import("../pages/referral"));
const Utilities = lazy(() => import("../pages/utilities"));
const Confirmation = lazy(() => import("../pages/wallet/confirmation"));
const Rank = lazy(() => import("../pages/rank"));
const Support = lazy(() => import("../pages/support"));
const DiceGame = lazy(() => import("../pages/dice"));
const BetDiceGame = lazy(() => import("../pages/betDice"));

const MainRoutes = {
  path: "/",
  element: (
    <AuthGuard tokenKey="ohtopup-token">
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
      element: <Transactions />,
    },
    {
      path: "transactions/:requestId",
      element: <TransactionDetail />,
    },
    {
      path: "wallet",
      element: <Wallet />,
    },
    {
      path: "wallet/:id",
      element: <Confirmation />,
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
      path: "utilities",
      element: <Utilities />,
    },
    {
      path: "rank",
      element: <Rank />,
    },
    {
      path: "support",
      element: <Support />,
    },
    {
      path: "dice",
      element: <DiceGame />,
    },
    {
      path: "bet-dice",
      element: <BetDiceGame />,
    },
  ],
};

export default MainRoutes;
