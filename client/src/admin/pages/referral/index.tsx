import React, { useState, useEffect } from "react";
import { FaUserTimes, FaWallet, FaUsers, FaTrophy, FaCoins, FaChartLine, FaPlus, FaDownload } from "react-icons/fa";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { getUser, getReferrals as getReferralsApi, addPoint } from "../../api";
import Pagination from "../../components/pagination";
import Table from "../../components/table";
import Modal from "../../components/modal";
import Textfield from "../../../components/ui/forms/input";
import Button from "../../../components/ui/forms/button";
import noData from "../../../assets/no-data.svg";
import { formatNairaAmount } from "../../../utils";

const Referral = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleModal = () => setIsOpen((prev) => !prev);

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsOpen(true);
  };

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const {
    data: referrals,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "referrals",
      { page: currentPage, limit, search: debouncedSearchTerm },
    ],
    queryFn: () => getReferralsApi(currentPage, limit, debouncedSearchTerm),
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  const columns = [
    {
      header: "Username",
      render: (item) => (
        <div className="font-medium text-gray-900">
          {item.username}
        </div>
      )
    },
    {
      header: "Referral Code",
      render: (item) => (
        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {item.referralCode}
        </div>
      )
    },
    {
      header: "Referred Users",
      render: (item) => (
        <div className="text-center">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
            {item?.referredUsers?.length || 0}
          </span>
        </div>
      ),
    },
    {
      header: "Points",
      render: (item) => (
        <div className="text-center">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
            {item?.points || 0}
          </span>
        </div>
      )
    },
    {
      header: "Performance",
      render: (item) => {
        const referrals = item?.referredUsers?.length || 0;
        const points = item?.points || 0;
        let performance = "Low";
        let colorClass = "bg-gray-100 text-gray-800";

        if (referrals >= 10 && points >= 500) {
          performance = "High";
          colorClass = "bg-green-100 text-green-800";
        } else if (referrals >= 5 && points >= 200) {
          performance = "Medium";
          colorClass = "bg-yellow-100 text-yellow-800";
        }

        return (
          <div className="text-center">
            <span className={`${colorClass} px-2 py-1 rounded-full text-xs font-medium`}>
              {performance}
            </span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      render: (user) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditUser(user)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            title="Add Points"
          >
            <FaPlus className="inline mr-1 h-3 w-3" />
            Add Points
          </button>
        </div>
      ),
    },
  ];

  const handleAddPoints = async (values, { resetForm }) => {
    setLoading(true);
    try {
      const amount = Number(values.amount);
      const data = {
        userId: currentUser._id,
        pointsToAdd: amount,
      };
      await addPoint(data);
      toast.success("Points added successfully!");
      resetForm();
      toggleModal();
      refetch();
    } catch (error) {
      toast.error("Error adding points: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate referral statistics
  const totalReferrers = referrals?.users?.length || 0;
  const totalReferredUsers = referrals?.users?.reduce((sum, user) => sum + (user?.referredUsers?.length || 0), 0) || 0;
  const totalPoints = referrals?.users?.reduce((sum, user) => sum + (user?.points || 0), 0) || 0;
  const avgReferralsPerUser = totalReferrers > 0 ? (totalReferredUsers / totalReferrers).toFixed(1) : 0;

  return (
    <>
      <div className="mb-4 md:mb-6 p-2 md:p-0">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">Referral Management</h1>
        <p className="text-gray-600 text-sm md:text-base">Monitor and manage user referral activities and rewards</p>
      </div>

      {/* Analytics Cards */}
      <div className="mb-4 md:mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 px-2 md:px-0">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs md:text-sm font-medium">Total Referrers</p>
              <p className="text-lg md:text-2xl font-bold">{totalReferrers}</p>
            </div>
            <FaUsers className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs md:text-sm font-medium">Total Referred Users</p>
              <p className="text-lg md:text-2xl font-bold">{totalReferredUsers}</p>
            </div>
            <FaChartLine className="h-6 w-6 md:h-8 md:w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs md:text-sm font-medium">Total Points Awarded</p>
              <p className="text-lg md:text-2xl font-bold">{totalPoints.toLocaleString()}</p>
            </div>
            <FaCoins className="h-6 w-6 md:h-8 md:w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs md:text-sm font-medium">Avg Referrals/User</p>
              <p className="text-lg md:text-2xl font-bold">{avgReferralsPerUser}</p>
            </div>
            <FaTrophy className="h-6 w-6 md:h-8 md:w-8 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="flex-1 min-h-[250px] flex flex-col justify-between">
          {isLoading ? (
            <p className="text-gray-500">Loading referrals...</p>
          ) : isError ? (
            <p className="text-red-500">Error loading referrals: {error.message}</p>
          ) : referrals?.users.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 px-2 md:px-0">
                <div className="text-xs md:text-sm text-gray-600">
                  {referrals?.users?.length || 0} users found
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="search"
                      placeholder="Search by username or referral code"
                      className="border border-gray-300 rounded-lg px-3 md:px-4 py-2 pl-8 md:pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaUsers className="absolute left-2 md:left-3 top-2.5 md:top-3 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                  </div>
                  {searchTerm && (
                    <button
                      className="bg-gray-500 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 text-xs md:text-sm"
                      onClick={handleClearSearch}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-xs md:text-sm"
                    onClick={() => toast.info("Export functionality coming soon!")}
                  >
                    <FaDownload className="inline mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                    Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto px-2 md:px-0">
              <Table columns={columns} data={referrals.users} />
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={referrals.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4 md:p-8 flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 mx-2 md:mx-0">
              <div className="bg-white rounded-full p-4 md:p-6 mb-4 md:mb-6 shadow-lg">
                <FaUsers className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No Referral Data</h3>
              <p className="text-gray-500 text-center text-sm md:text-base max-w-md px-2">
                There are no users with referral activity yet. Users will appear here once they start referring others and earning points.
              </p>
              <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full max-w-lg">
                <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                  <FaUsers className="w-5 h-5 md:w-6 md:h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs md:text-sm text-gray-600">Users will register</p>
                </div>
                <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                  <FaChartLine className="w-5 h-5 md:w-6 md:h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs md:text-sm text-gray-600">Users refer others</p>
                </div>
                <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                  <FaCoins className="w-5 h-5 md:w-6 md:h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-xs md:text-sm text-gray-600">Points are earned</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6"
          onClick={toggleModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto transform transition-all duration-300 scale-100 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700 dark:hover:scrollbar-thumb-gray-500 px-2 sm:px-0 pb-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full mb-4">
                <FaCoins className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Add Referral Points
              </h3>
              <p className="text-sm text-gray-600">
                Reward {currentUser?.username} for successful referrals
              </p>
            </div>

            {/* User Details */}
            <div className="mb-6 p-6 rounded-xl bg-gray-50">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-600">Username</span>
                  <span className="font-semibold text-lg text-gray-900">
                    {currentUser?.username}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-600">Current Points</span>
                  <span className="font-semibold text-lg text-green-600">
                    {currentUser?.points || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-600">Referred Users</span>
                  <span className="font-semibold text-lg text-blue-600">
                    {currentUser?.referredUsers?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <Formik
              initialValues={{ amount: "" }}
              validationSchema={Yup.object({
                amount: Yup.number()
                  .required("Amount is required")
                  .positive("Amount must be positive")
                  .min(1, "Amount must be at least 1 point"),
              })}
              onSubmit={handleAddPoints}
            >
              {({ errors, touched, setFieldValue }) => (
                <Form className="space-y-6">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                      Points to Add:
                    </label>
                    <Field
                      name="amount"
                      as={Textfield}
                      placeholder="Enter points amount"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {errors.amount && touched.amount && (
                      <div className="text-red-600 text-sm mt-1">{errors.amount}</div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={toggleModal}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding Points...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <FaPlus className="h-5 w-5 mr-2" />
                          Add Points
                        </span>
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
        </div>
      )}
    </>
  );
};

export default Referral;