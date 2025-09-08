import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserRewards, getUserAchievements, getAllRewards, getRanking, getUser } from "../../api";
import { FaGift, FaTrophy, FaCoins, FaChevronRight } from 'react-icons/fa';

const GiftPoint = () => {
  const navigate = useNavigate();

  const { data: userRewardsData } = useQuery({
    queryKey: ["user-rewards-dashboard"],
    queryFn: () => getUserRewards(),
    staleTime: 30000,
  });

  const { data: achievementsData } = useQuery({
    queryKey: ["achievements-dashboard"],
    queryFn: getUserAchievements,
    staleTime: 30000,
  });

  const { data: allRewardsData } = useQuery({
    queryKey: ["all-rewards-dashboard"],
    queryFn: () => getAllRewards({ page: 1, limit: 10 }),
    staleTime: 30000,
  });

  const { data: rankingData } = useQuery({
    queryKey: ["user-rank-dashboard"],
    queryFn: () => getRanking('weekly'),
    staleTime: 30000,
  });

  const { data: userData } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: getUser,
    staleTime: 60000,
  });

  // Find user's current rank
  const userStats = rankingData?.rankings?.find(user => user.username === userData?.username?.replace(/.(?=.{3})/g, "*"));

  const activeRewards = userRewardsData?.userRewards?.filter(reward => reward.status === 'assigned') || [];
  const totalPoints = achievementsData?.totalPoints || 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <FaGift className="text-yellow-600 text-lg" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">My Rewards</h3>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md">
          <FaCoins className="text-yellow-600 text-sm" />
          <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{totalPoints}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{activeRewards.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{totalPoints}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Points</div>
          </div>
        </div>
      </div>

      {userStats && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-300">Rank #{userStats.rank}</div>
              <div className="text-xs text-blue-700 dark:text-blue-400">{userStats.points} pts</div>
            </div>
            <div className="text-lg">🏆</div>
          </div>
        </div>
      )}

      <div className="mt-auto space-y-2">
        <button
          onClick={() => navigate("/rank")}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm"
        >
          <FaTrophy className="text-xs" />
          Rankings
        </button>

        {activeRewards.length > 0 && (
          <div className="text-center">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              {activeRewards[0].rewardSnapshot?.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftPoint;