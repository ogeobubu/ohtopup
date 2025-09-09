import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getReferrals as getReferralsApi } from "../../api";
import { FaShareAlt } from "react-icons/fa";
import gift from "../../assets/gift.svg";
import noData from "../../assets/no-data.svg";
import Pagination from "../../admin/components/pagination";

const Referral = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const user = useSelector((state) => state.user.user);
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  const {
    data: referrals,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "referrals",
      { page: currentPage, limit, search: debouncedSearchTerm },
    ],
    queryFn: () => getReferralsApi(currentPage, limit, debouncedSearchTerm),
    keepPreviousData: true,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on this platform!",
          text: `Use my referral code: ${user?.referralCode}`,
          url: `https://ohtopup.onrender.com/create?code=${user?.referralCode}`,
        });
        toast.success("Referral link shared successfully!");
      } catch {
        toast.error("Failed to share the referral link.");
      }
    } else {
      navigator.clipboard.writeText(user?.referralCode);
      toast.success("Referral code copied to clipboard!");
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  return (
    <>
      <div className="mb-6 md:mb-8">
        <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Referral Program
        </h1>
        <p className={`text-sm md:text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Invite friends and earn rewards when they join and make their first deposit
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
        {/* Main Referral Card */}
        <div className={`xl:col-span-2 rounded-xl shadow-lg p-6 lg:p-8 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="text-center mb-6 lg:mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full mb-4 lg:mb-6 ${
              isDarkMode ? 'bg-green-600' : 'bg-green-100'
            }`}>
              <img className="w-8 h-8 lg:w-10 lg:h-10 object-contain" src={gift} alt="gift" />
            </div>
            <h2 className={`text-xl lg:text-2xl font-bold mb-3 lg:mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Earn ₦500 for Every Referral
            </h2>
            <p className={`text-base lg:text-lg mb-4 lg:mb-6 max-w-2xl mx-auto leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Share your referral code and get rewarded when your friends make their first ₦1,000 deposit
            </p>
          </div>

          {/* How it works */}
          <div className="mb-6 lg:mb-8">
            <h3 className={`text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-center ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
              {[
                {
                  step: '1',
                  title: 'Share Your Code',
                  description: 'Send your unique referral code to friends and family',
                  icon: '📤'
                },
                {
                  step: '2',
                  title: 'They Sign Up',
                  description: 'Friends register using your referral code',
                  icon: '👥'
                },
                {
                  step: '3',
                  title: 'First Deposit',
                  description: 'They make their first ₦1,000+ deposit',
                  icon: '💰'
                },
                {
                  step: '4',
                  title: 'You Earn ₦500',
                  description: 'Points are credited to your account instantly',
                  icon: '🎉'
                }
              ].map((item, index) => (
                <div key={item.step} className={`text-center p-4 lg:p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
                }`}>
                  <div className="text-2xl lg:text-3xl mb-3 lg:mb-4">{item.icon}</div>
                  <div className={`inline-flex items-center justify-center w-6 h-6 lg:w-8 lg:h-8 rounded-full mb-3 lg:mb-4 text-xs lg:text-sm font-bold ${
                    isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {item.step}
                  </div>
                  <h4 className={`font-semibold mb-2 lg:mb-3 text-sm lg:text-base ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {item.title}
                  </h4>
                  <p className={`text-xs lg:text-sm leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Code Section */}
          <div className={`p-4 md:p-6 rounded-lg border-2 border-dashed ${
            isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
          }`}>
            <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 text-center ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Your Referral Code
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <div className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-mono text-sm md:text-lg font-bold text-center break-all ${
                isDarkMode ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-300'
              }`}>
                {user?.referralCode}
              </div>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors w-full sm:w-auto text-sm md:text-base"
              >
                <FaShareAlt className="text-sm md:text-base" />
                Share Code
              </button>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className={`rounded-xl shadow-lg p-4 lg:p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-lg lg:text-xl font-bold mb-3 lg:mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Your Stats
          </h3>
          <div className="space-y-3 lg:space-y-4">
            <div className={`p-3 lg:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Total Referrals
                </span>
                <span className={`text-xl lg:text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {referrals?.totalUsers || 0}
                </span>
              </div>
            </div>
            <div className={`p-3 lg:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Points Earned
                </span>
                <span className={`text-xl lg:text-2xl font-bold text-green-600`}>
                  {user?.points || 0}
                </span>
              </div>
            </div>
            <div className={`p-3 lg:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Potential Earnings
                </span>
                <span className={`text-xl lg:text-2xl font-bold text-blue-600`}>
                  ₦{(referrals?.totalUsers || 0) * 500}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className={`rounded-xl shadow-lg p-4 lg:p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 lg:mb-6">
          <h2 className={`text-lg lg:text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Your Referrals
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 md:mt-0 w-full sm:w-auto">
            <input
              type="search"
              placeholder="Search by username or email"
              className={`border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base w-full sm:w-64 ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                  : "border-gray-300 bg-white text-gray-900"
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm md:text-base font-medium"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={`ml-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Loading referrals...
            </span>
          </div>
        ) : isError ? (
          <div className={`text-center py-12 px-6 rounded-lg ${
            isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold mb-2">Error loading referrals</p>
            <p className={`text-sm ${isDarkMode ? "text-red-300" : "text-red-500"}`}>
              {error?.message || "Something went wrong. Please try again."}
            </p>
          </div>
        ) : referrals?.users?.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600">
              <table className={`w-full ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                <thead className={`${isDarkMode ? "bg-gradient-to-r from-gray-700 to-gray-600" : "bg-gradient-to-r from-gray-100 to-gray-200"}`}>
                  <tr>
                    <th className="py-4 lg:py-6 px-4 lg:px-8 text-left font-bold text-sm lg:text-base text-gray-700 dark:text-gray-300">Username</th>
                    <th className="py-4 lg:py-6 px-4 lg:px-8 text-left font-bold text-sm lg:text-base text-gray-700 dark:text-gray-300">Email</th>
                    <th className="py-4 lg:py-6 px-4 lg:px-8 text-left font-bold text-sm lg:text-base text-gray-700 dark:text-gray-300">Joined Date</th>
                    <th className="py-4 lg:py-6 px-4 lg:px-8 text-left font-bold text-sm lg:text-base text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {referrals.users.map((u) => (
                    <tr key={u._id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 transform hover:scale-[1.01]`}>
                      <td className="py-4 lg:py-6 px-4 lg:px-8">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-sm lg:text-base font-bold shadow-md ${
                            isDarkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700'
                          }`}>
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="ml-3 lg:ml-4 font-semibold text-sm lg:text-base text-gray-900 dark:text-white">{u.username}</span>
                        </div>
                      </td>
                      <td className="py-4 lg:py-6 px-4 lg:px-8 text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">{u.email}</td>
                      <td className="py-4 lg:py-6 px-4 lg:px-8 text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">
                        {new Date(u.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 lg:py-6 px-4 lg:px-8">
                        <span className={`inline-flex items-center px-3 py-2 text-xs lg:text-sm font-bold rounded-full shadow-sm ${
                          u.points > 0
                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900 dark:to-green-800 dark:text-green-200'
                            : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900 dark:to-yellow-800 dark:text-yellow-200'
                        }`}>
                          {u.points > 0 ? '✓ Rewarded' : '⏳ Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={referrals.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className={`text-center py-12 md:py-16 px-4 md:px-6 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <img className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 opacity-50" src={noData} alt="No referrals" />
            <h3 className={`text-lg lg:text-xl font-bold mb-3 lg:mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
              Start Your Referral Journey
            </h3>
            <p className={`text-sm lg:text-base mb-6 lg:mb-8 max-w-2xl mx-auto leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Share your unique referral code and earn ₦500 for every friend who joins and makes their first deposit.
              The more you share, the more you earn!
            </p>
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-lg font-semibold transition-colors text-base lg:text-lg w-full lg:w-auto"
            >
              <FaShareAlt className="text-lg lg:text-xl" />
              Share Your Code
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Referral;