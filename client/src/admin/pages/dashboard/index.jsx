import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { getUser, getAllUsers, getUtilityAnalytics } from "../../api";
import { setUser, setUsers } from "../../../actions/adminActions";
import Card from "./card";
import { FaMoneyCheckAlt, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import MyBarChart from "./chart";

const Dashboard = () => {
  const dispatch = useDispatch();

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const {
    data: analytic,
    isLoading: isAnalyticLoading,
    isError: isAnalyticError,
    error: analyticError,
  } = useQuery({
    queryKey: ["analytic"],
    queryFn: getUtilityAnalytics,
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (usersData) {
      dispatch(setUsers(usersData.users));
    }
  }, [usersData, dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(setUser(user));
    }
  }, [user, dispatch]);

  const chartData = analytic ? prepareChartData(analytic.monthly) : [];

  if (isUserLoading || isAnalyticLoading || isUsersLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (isUserError) {
    return <div className="text-red-500 text-center">Error loading user data: {userError.message}</div>;
  }

  if (isAnalyticError) {
    return <div className="text-red-500 text-center">Error loading analytics: {analyticError.message}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-5">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Card
          title="Total Transactions"
          count={analytic?.overall?.totalTransactions || 0}
          icon={FaMoneyCheckAlt}
          bgColor="bg-blue-200"
        />
        <Card
          title="Total Delivered"
          count={analytic?.overall?.totalDelivered || 0}
          icon={FaCheckCircle}
          bgColor="bg-green-200"
        />
        <Card
          title="Total Pending"
          count={analytic?.overall?.totalPending || 0}
          icon={FaClock}
          bgColor="bg-gray-200"
        />
        <Card
          title="Total Failed"
          count={analytic?.overall?.totalFailed || 0}
          icon={FaTimesCircle}
          bgColor="bg-red-200"
        />
      </div>
      <div className="my-5">
        <MyBarChart data={chartData} />
      </div>
    </div>
  );
};

const prepareChartData = (analyticData) => {
  return analyticData?.map((item) => ({
    _id: item._id || "No Data",
    totalRevenue: item.totalRevenue || 0,
    totalGross: item.totalGross || 0,
  }));
};

export default Dashboard;