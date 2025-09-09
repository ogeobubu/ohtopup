import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRanking, getUser, getUserAchievements, getUserRewards, redeemUserReward, getAllRewards } from "../../api";
import {
  FaTrophy,
  FaMedal,
  FaCrown,
  FaStar,
  FaFire,
  FaGift,
  FaShare,
  FaUser,
  FaCoins,
  FaChartLine,
  FaCalendarAlt
} from "react-icons/fa";
import { useSelector } from "react-redux";

const Rank = () => {
  const [activeTab, setActiveTab] = useState("Leaderboard");
  const [userPosition, setUserPosition] = useState(null);

  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  const { data: rankingData, error: rankingError, isLoading: rankingLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: () => getRanking('weekly'),
    staleTime: 30000, // 30 seconds
  });

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 60000, // 1 minute
  });

  // Find user's current rank
  const userStats = rankingData?.rankings?.find(user => user.username === userData?.username?.replace(/.(?=.{3})/g, "*"));

  const { data: achievementsData } = useQuery({
    queryKey: ["achievements"],
    queryFn: getUserAchievements,
    staleTime: 30000, // 30 seconds
  });

  const { data: userRewardsData, refetch: refetchUserRewards } = useQuery({
    queryKey: ["user-rewards"],
    queryFn: () => getUserRewards(),
    enabled: !!userData?.id,
    staleTime: 30000, // 30 seconds
  });

  const { data: allRewardsData } = useQuery({
    queryKey: ["all-rewards"],
    queryFn: () => getAllRewards({ page: 1, limit: 50 }),
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    if (rankingData?.rankings && userData) {
      // Find user's position in rankings
      const userRank = rankingData.rankings.findIndex(
        (rank) => rank.username === userData.username
      );
      if (userRank !== -1) {
        setUserPosition(userRank + 1);
      }
    }
  }, [rankingData, userData]);

  const formatCountdown = (seconds) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FaCrown className="text-yellow-500 text-xl" />;
      case 2:
        return <FaMedal className="text-gray-400 text-xl" />;
      case 3:
        return <FaMedal className="text-amber-600 text-xl" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      return (
        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
          rank === 1 ? 'bg-yellow-500 text-white' :
          rank === 2 ? 'bg-gray-400 text-white' :
          'bg-amber-600 text-white'
        }`}>
          TOP {rank}
        </div>
      );
    }
    return null;
  };

  const getAchievementBadges = (rank, transactionCount) => {
    const badges = [];

    if (rank <= 3) {
      badges.push(
        <div key="top3" className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs">
          <FaTrophy className="text-xs" />
          Elite
        </div>
      );
    }

    if (transactionCount >= 50) {
      badges.push(
        <div key="power" className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-xs">
          <FaFire className="text-xs" />
          Power User
        </div>
      );
    }

    if (transactionCount >= 25) {
      badges.push(
        <div key="active" className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-xs">
          <FaStar className="text-xs" />
          Active
        </div>
      );
    }

    return badges;
  };

  const getBusinessIncentives = (rank) => {
    const incentives = {
      1: { discount: 15, bonus: 500, title: "🏆 Champion" },
      2: { discount: 12, bonus: 300, title: "🥈 Runner-up" },
      3: { discount: 10, bonus: 200, title: "🥉 Third Place" },
      4: { discount: 5, bonus: 0, title: "Top 10" },
      5: { discount: 5, bonus: 0, title: "Top 10" },
    };

    return incentives[rank] || { discount: 0, bonus: 0, title: "Participant" };
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 md:py-8 px-3 md:px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2 md:gap-3">
            <FaTrophy className="text-yellow-300 text-lg md:text-xl" />
            <span className="leading-tight">Utility Champions League</span>
            <FaTrophy className="text-yellow-300 text-lg md:text-xl" />
          </h1>
          <p className="text-blue-100 text-sm md:text-lg px-2">
            Compete, earn rewards, and climb the leaderboard!
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* User Stats Card */}
        {userStats && (
          <div className={`mb-6 md:mb-8 p-4 md:p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                <FaUser className="text-blue-500 text-base md:text-lg" />
                Your Performance
              </h2>
              <div className="flex gap-2 flex-wrap">
                {getAchievementBadges(userPosition, userStats.transactionCount)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className={`p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {getRankIcon(userPosition)}
                  <span className="font-semibold text-sm md:text-base">Your Rank</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-blue-600">#{userPosition}</div>
              </div>

              <div className={`p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaChartLine className="text-green-500 text-sm md:text-base" />
                  <span className="font-semibold text-sm md:text-base">Transactions</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-green-600">{userStats.transactionCount}</div>
              </div>

              <div className={`p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaCoins className="text-yellow-500 text-sm md:text-base" />
                  <span className="font-semibold text-sm md:text-base">Points</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-yellow-600">
                  {userStats.points || 0}
                </div>
              </div>

              <div className={`p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaGift className="text-purple-500 text-sm md:text-base" />
                  <span className="font-semibold text-sm md:text-base">Rewards</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-purple-600">
                  {getBusinessIncentives(userPosition).discount}% OFF
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            {achievementsData && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FaTrophy className="text-orange-500" />
                  Recent Achievements
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {achievementsData.recentAchievements?.map((achievement, index) => (
                    <div key={index} className={`flex-shrink-0 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-orange-50'} border`}>
                      <div className="flex items-center gap-2">
                        <FaStar className="text-orange-500 text-sm" />
                        <div>
                          <div className="font-semibold text-sm capitalize">
                            {achievement.type.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            +{achievement.points} points
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-4 md:mb-6 flex justify-center px-2">
          <div className={`flex w-full max-w-md md:max-w-none rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'} p-1 overflow-hidden`}>
            {["Leaderboard", "Rewards", "Achievements"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-md font-medium transition-all duration-300 text-xs md:text-sm ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-md"
                    : `${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:bg-gray-100`
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "Leaderboard" ? "Rankings" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === "Leaderboard" && (
          <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Top 3 Podium */}
            {rankingData?.rankings && rankingData.rankings.length >= 3 && (
              <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 p-4 md:p-6">
                <div className="flex justify-center items-end gap-2 md:gap-4 mb-3 md:mb-4">
                  {/* 2nd Place */}
                  <div className="text-center">
                    <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                      <FaMedal className="text-gray-400 text-lg md:text-xl" />
                    </div>
                    <div className={`w-16 h-12 md:w-20 md:h-16 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-t-lg flex items-end justify-center pb-2`}>
                      <span className="text-xs font-bold text-gray-700">2</span>
                    </div>
                    <p className="text-xs mt-1 font-semibold text-white truncate max-w-16 md:max-w-20">
                      {rankingData.rankings[1]?.username || '---'}
                    </p>
                  </div>

                  {/* 1st Place */}
                  <div className="text-center">
                    <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-2 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'}`}>
                      <FaCrown className="text-white text-xl md:text-2xl" />
                    </div>
                    <div className={`w-20 h-16 md:w-24 md:h-20 ${isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'} rounded-t-lg flex items-end justify-center pb-2`}>
                      <span className="text-sm font-bold text-white">1</span>
                    </div>
                    <p className="text-sm mt-1 font-bold text-white truncate max-w-20 md:max-w-24">
                      {rankingData.rankings[0]?.username || '---'}
                    </p>
                  </div>

                  {/* 3rd Place */}
                  <div className="text-center">
                    <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                      <FaMedal className="text-amber-600 text-lg md:text-xl" />
                    </div>
                    <div className={`w-16 h-10 md:w-20 md:h-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-t-lg flex items-end justify-center pb-2`}>
                      <span className="text-xs font-bold text-gray-700">3</span>
                    </div>
                    <p className="text-xs mt-1 font-semibold text-white truncate max-w-16 md:max-w-20">
                      {rankingData.rankings[2]?.username || '---'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rankings List */}
            <div className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
                <FaChartLine className="text-blue-500 text-base md:text-lg" />
                Full Rankings
              </h3>

              {rankingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading leaderboard...</p>
                </div>
              ) : rankingError ? (
                <div className="text-center py-8 text-red-500">
                  Error loading rankings: {rankingError.message}
                </div>
              ) : (
                <div className="space-y-2">
                  {rankingData?.rankings?.map((user, index) => {
                    const rank = index + 1;
                    const incentives = getBusinessIncentives(rank);
                    const isCurrentUser = userData?.username === user.username;

                    return (
                      <div
                        key={index}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg transition-all duration-300 gap-2 sm:gap-0 ${
                          isCurrentUser
                            ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                            : `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`
                        }`}
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
                            {getRankIcon(rank)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm md:text-base truncate ${isCurrentUser ? 'text-blue-600' : ''}`}>
                                {user.username}
                                {isCurrentUser && <span className="text-xs text-blue-600 ml-1">(You)</span>}
                              </span>
                              {getRankBadge(rank)}
                            </div>
                            <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <FaCoins className="text-yellow-500 text-xs" />
                                <span className="hidden sm:inline">{user.transactionCount} transactions</span>
                                <span className="sm:hidden">{user.transactionCount}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {incentives.discount > 0 && (
                              <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-bold">
                                {incentives.discount}% OFF
                              </div>
                            )}
                            {incentives.bonus > 0 && (
                              <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-bold">
                                ₦{incentives.bonus}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Rewards" && (
          <div className={`rounded-xl shadow-lg p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <FaGift className="text-purple-500 text-base md:text-lg" />
              My Rewards
            </h3>

            {/* User's Assigned Rewards */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-4">Assigned Rewards</h4>
              {userRewardsData?.userRewards?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userRewardsData.userRewards.map((userReward) => (
                    <div key={userReward._id} className={`p-3 md:p-4 rounded-lg border-2 ${
                      userReward.status === 'assigned'
                        ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900'
                        : userReward.status === 'redeemed'
                        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900'
                        : 'border-gray-400 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaGift className="text-purple-500" />
                          <span className="font-bold">{userReward.rewardSnapshot?.name || 'Reward'}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          userReward.status === 'assigned' ? 'bg-green-100 text-green-800' :
                          userReward.status === 'redeemed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {userReward.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-bold capitalize">{userReward.rewardSnapshot?.type || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Value:</span>
                          <span className="font-bold text-purple-600">
                            {userReward.rewardSnapshot?.type === 'discount'
                              ? `${userReward.rewardSnapshot?.value}%`
                              : `₦${userReward.rewardSnapshot?.value || 0}`
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Assigned:</span>
                          <span className="text-xs">
                            {new Date(userReward.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {userReward.status === 'assigned' && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to redeem this reward?')) {
                              try {
                                await redeemUserReward(userReward._id);
                                refetchUserRewards();
                                alert('Reward redeemed successfully!');
                              } catch (error) {
                                console.error('Error redeeming reward:', error);
                                alert('Failed to redeem reward. Please try again.');
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Redeem Reward
                        </button>
                      )}

                      {userReward.status === 'redeemed' && (
                        <div className="text-center text-green-600 font-semibold text-sm">
                          ✅ Redeemed on {new Date(userReward.redeemedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FaGift className="text-4xl mx-auto mb-3 opacity-50" />
                  <p>No rewards assigned yet</p>
                  <p className="text-sm mt-1">Keep using the platform to earn rewards!</p>
                </div>
              )}
            </div>

            {/* Available Rewards System */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold mb-4">Available Rewards</h4>
              {allRewardsData?.rewards?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allRewardsData.rewards
                    .filter(reward => reward.isActive)
                    .map((reward) => (
                    <div key={reward._id} className={`p-4 rounded-lg border-2 ${
                      reward.rank <= 3 ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900' :
                      'border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getRankIcon(reward.rank)}
                          <span className="font-bold">{reward.name}</span>
                        </div>
                        {reward.rank <= 3 && <FaStar className="text-yellow-500" />}
                      </div>

                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-bold capitalize text-blue-600">{reward.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Value:</span>
                          <span className="font-bold text-purple-600">
                            {reward.type === 'discount' ? `${reward.value}%` :
                             reward.type === 'bonus' ? `₦${reward.value}` :
                             reward.value}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rank Required:</span>
                          <span className="font-bold text-green-600">#{reward.rank}</span>
                        </div>
                        {reward.description && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            {reward.description}
                          </div>
                        )}
                      </div>

                      {/* Show if user can claim this reward */}
                      {userStats && userStats.rank >= reward.rank && (
                        <div className="mt-3 p-2 bg-green-100 dark:bg-green-900 rounded text-center">
                          <span className="text-xs font-semibold text-green-800 dark:text-green-200">
                            🎉 You qualify for this reward!
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FaGift className="text-4xl mx-auto mb-3 opacity-50" />
                  <p>No rewards available yet</p>
                  <p className="text-sm mt-1">Rewards will be added by administrators</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Achievements" && (
          <div className={`rounded-xl shadow-lg p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <FaTrophy className="text-orange-500 text-base md:text-lg" />
              Achievement Badges
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="p-3 md:p-4 border rounded-lg text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <FaFire className="text-white text-lg md:text-2xl" />
                </div>
                <h4 className="font-bold mb-1 text-sm md:text-base">Power User</h4>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Complete 50+ transactions</p>
              </div>

              <div className="p-3 md:p-4 border rounded-lg text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <FaStar className="text-white text-lg md:text-2xl" />
                </div>
                <h4 className="font-bold mb-1 text-sm md:text-base">Active Member</h4>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Complete 25+ transactions</p>
              </div>

              <div className="p-3 md:p-4 border rounded-lg text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <FaTrophy className="text-white text-lg md:text-2xl" />
                </div>
                <h4 className="font-bold mb-1 text-sm md:text-base">Elite Member</h4>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Top 3 on leaderboard</p>
              </div>
            </div>
          </div>
        )}

        {/* Countdown Timer */}
        {rankingData?.countdown && (
          <div className={`mt-6 md:mt-8 p-3 md:p-4 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaCalendarAlt className="text-blue-500 text-sm md:text-base" />
              <span className="font-semibold text-sm md:text-base">Next Reset In:</span>
            </div>
            <div className="text-lg md:text-2xl font-bold text-blue-600">
              {formatCountdown(rankingData.countdown)}
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Rankings reset every Sunday at midnight
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rank;