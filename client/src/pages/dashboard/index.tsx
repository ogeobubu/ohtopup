import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { getUser, getWallet, getTransactions } from "../../api";
import { setUser } from "../../actions/userActions";
import Wallet from "./wallet";
import Refer from "./refer";
import Gift from "./gift";
import Shortcut from "./shortcut";
import AIRecommendations from "../../components/ui/AIRecommendations";
import { FaArrowUp, FaArrowDown, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { formatNairaAmount } from "../../utils";

const Dashboard = () => {
  const dispatch = useDispatch();

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const { data: walletData, error: walletError, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });

  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: () => getTransactions("", 1, 5), // Get recent 5 transactions
  });

  useEffect(() => {
    if (user) {
      dispatch(setUser(user));
    }
  }, [user, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 dark:text-red-400 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">
                Welcome back, {user?.username || 'User'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-lg">
                Here's what's happening with your account today.
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl md:text-3xl">🎉</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 items-stretch">
          <div className="sm:col-span-1 lg:col-span-1">
            <Wallet data={walletData} />
          </div>
          <div className="sm:col-span-1 lg:col-span-1">
            <Gift />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Refer />
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-sm">⚡</span>
            </div>
          </div>
          <Shortcut />
        </div>

        {/* AI Recommendations Section */}
        <AIRecommendations
          transactions={transactionsData?.transactions || []}
          walletBalance={walletData?.balance || 0}
        />

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 md:p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs md:text-base">Your latest transactions and account activities</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400">📊</span>
              </div>
            </div>
          </div>

        {transactionsLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading recent activity...</p>
          </div>
        ) : transactionsError ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-2">
              <FaTimesCircle className="text-4xl mx-auto" />
            </div>
            <p className="text-red-600 dark:text-red-400">Error loading recent activity</p>
          </div>
        ) : !transactionsData?.transactions || transactionsData.transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FaClock className="text-4xl mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No Recent Activity</h3>
            <p className="text-gray-600 dark:text-gray-400">Your recent transactions will appear here</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="block md:hidden space-y-3 p-3">
              {transactionsData.transactions.slice(0, 5).map((transaction, index) => (
                <div key={transaction._id || index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        transaction.type === 'deposit'
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : transaction.type === 'withdrawal'
                          ? 'bg-red-100 dark:bg-red-900/20'
                          : 'bg-blue-100 dark:bg-blue-900/20'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <FaArrowDown className="text-green-600 dark:text-green-400" />
                        ) : transaction.type === 'withdrawal' ? (
                          <FaArrowUp className="text-red-600 dark:text-red-400" />
                        ) : (
                          <FaClock className="text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {transaction.type}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.reference ? `Ref: ${transaction.reference.slice(-8)}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatNairaAmount(transaction.amount)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {transaction.status === 'delivered' || transaction.status === 'successful' ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <FaCheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Success</span>
                        </div>
                      ) : transaction.status === 'pending' ? (
                        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                          <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 dark:text-red-400">
                          <FaTimesCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Failed</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactionsData.transactions.slice(0, 5).map((transaction, index) => (
                    <tr key={transaction._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            transaction.type === 'deposit'
                              ? 'bg-green-100 dark:bg-green-900/20'
                              : transaction.type === 'withdrawal'
                              ? 'bg-red-100 dark:bg-red-900/20'
                              : 'bg-blue-100 dark:bg-blue-900/20'
                          }`}>
                            {transaction.type === 'deposit' ? (
                              <FaArrowDown className="text-green-600 dark:text-green-400 text-sm" />
                            ) : transaction.type === 'withdrawal' ? (
                              <FaArrowUp className="text-red-600 dark:text-red-400 text-sm" />
                            ) : (
                              <FaClock className="text-blue-600 dark:text-blue-400 text-sm" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {transaction.type}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {transaction.reference ? `Ref: ${transaction.reference.slice(-8)}` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatNairaAmount(transaction.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {transaction.status === 'delivered' || transaction.status === 'successful' ? (
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <FaCheckCircle className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">Success</span>
                            </div>
                          ) : transaction.status === 'pending' ? (
                            <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                              <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                              <span className="text-sm font-medium">Pending</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600 dark:text-red-400">
                              <FaTimesCircle className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">Failed</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* View All Link */}
        {transactionsData?.transactions && transactionsData.transactions.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <a
              href="/transactions"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center justify-center transition-colors duration-200"
            >
              View All Transactions →
            </a>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;