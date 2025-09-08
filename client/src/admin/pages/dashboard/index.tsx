import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { getUser, getAllUsers, getUtilityAnalytics } from "../../api";
import { setAdminUser, setUsers } from "../../../actions/adminActions";
import Card from "./card";
import { FaMoneyCheckAlt, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import MyBarChart from "./chart";
import Shortcut from "./shortcut";
import Spinner from "../../components/spinner"

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
      dispatch(setAdminUser(user));
    }
  }, [user, dispatch]);

  const chartData = analytic ? prepareChartData(analytic.monthly) : [];

  if (isUserLoading || isAnalyticLoading || isUsersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isUserError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 dark:text-red-400 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-sm">{userError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="bg-green-600 rounded-lg p-4 text-white">
        <h1 className="text-xl md:text-2xl font-bold mb-1">
          Admin Dashboard 👋
        </h1>
        <p className="text-green-100 text-sm">
          Monitor your platform's performance and manage operations.
        </p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Total Transactions"
          count={analytic?.overall?.totalTransactions || 0}
          icon={FaMoneyCheckAlt}
          bgColor="bg-blue-500"
        />
        <Card
          title="Total Delivered"
          count={analytic?.overall?.totalDelivered || 0}
          icon={FaCheckCircle}
          bgColor="bg-green-500"
        />
        <Card
          title="Total Pending"
          count={analytic?.overall?.totalPending || 0}
          icon={FaClock}
          bgColor="bg-yellow-500"
        />
        <Card
          title="Total Failed"
          count={analytic?.overall?.totalFailed || 0}
          icon={FaTimesCircle}
          bgColor="bg-red-500"
        />
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Quick Actions
        </h2>
        <Shortcut />
      </div>

      {/* Analytics Chart Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Transaction Analytics
        </h2>
        <div className="w-full overflow-x-auto">
          <MyBarChart data={chartData} />
        </div>
      </div>

      {/* Additional Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            User Management
          </h3>
          <p className="text-xl font-bold text-blue-600 mb-1">
            {usersData?.totalCount || 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total registered users
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            System Status
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-600 font-medium text-sm">All Systems Operational</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Revenue Today
          </h3>
          <p className="text-xl font-bold text-green-600 mb-1">
            ₦{analytic?.overall?.totalRevenue?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total revenue generated
          </p>
        </div>
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