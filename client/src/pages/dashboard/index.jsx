import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { getUser, getWallet } from "../../api";
import { setUser } from "../../actions/userActions";
import Wallet from "./wallet";
import Refer from "./refer";
import Gift from "./gift";
import Shortcut from "./shortcut";

const Dashboard = () => {
  const dispatch = useDispatch();
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const { data: walletData, error: walletError, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });

  useEffect(() => {
    if (user) {
      dispatch(setUser(user));
    }
  }, [user, dispatch]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <Wallet data={walletData} />
        <Gift />
        <Refer />
      </div>
      <Shortcut />
    </div>
  );
};

export default Dashboard;
