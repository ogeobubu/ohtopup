import { lazy } from "react";
import { useSelector } from "react-redux";
import AuthGuard from "../utils/guard";
import MainLayout from "../layout/mainLayout";
import Dashboard from "../pages/dashboard";
import Transactions from "../pages/transactions";
import TransactionDetail from "../pages/TransactionDetail";
import Wallet from "../pages/wallet";
import Settings from "../pages/settings";
import Referral from "../pages/referral";
import Utilities from "../pages/utilities";
import Confirmation from "../pages/wallet/confirmation";
import Rank from "../pages/rank";
import Support from "../pages/support";
import DiceGame from "../pages/dice";
import BetDiceGame from "../pages/betDice";

const TransactionDetailWrapper = () => {
  const isDarkMode = useSelector((state:any) => state.theme && state.theme.isDarkMode);
  return <TransactionDetail isDarkMode={isDarkMode} />;
};

const MainRoutes = {
  path: "/",
  element: (
    <AuthGuard tokenKey="ohtopup-token">
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
      element: <Transactions />,
    },
    {
      path: "transactions/:requestId",
      element: <TransactionDetailWrapper />,
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
