import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaTrophy,
  FaUsers,
  FaChartLine,
  FaCog,
  FaGift,
  FaMedal,
  FaCrown,
  FaStar,
  FaCalendarAlt,
  FaDownload,
  FaSync,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaCheck,
  FaTimes,
  FaEye,
  FaGamepad,
  FaWallet
} from "react-icons/fa";
import {
  getRanking,
  getAllRewards,
  createReward,
  updateReward,
  deleteReward,
  assignRewardToUser,
  getUserRewards,
  redeemReward,
  getRewardAnalytics,
  manualResetRankings,
  exportRankingsToCSV,
} from "../../../api";
import {
  addPoint,
} from "../../api";

import {
  getRewardSettings,
  updateRewardSettings,
  resetRewardSettings,
  getRewardSystemStats,
  bulkUpdateRewardStatus,
} from "../../api";

import {
  getAllGames,
  getGameStats,
  getManagementWallet,
} from "../../../api";

const AssignRewardModal = ({ reward, rankingData, onAssign, onCancel }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [notes, setNotes] = useState('');

  // Reset selectedUser when modal opens
  React.useEffect(() => {
    setSelectedUser('');
  }, [reward]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser || !reward) return;

    // Ensure selectedUser is a valid ObjectId (should be a 24-character hex string)
    if (!/^[0-9a-fA-F]{24}$/.test(selectedUser)) {
      console.error('Invalid user ID format:', selectedUser);
      alert('Invalid user selection. Please try again.');
      return;
    }

    const assignmentData = {
      userId: selectedUser,
      rewardId: reward._id,
      notes: notes.trim() || undefined,
    };

    console.log('Submitting assignment data:', assignmentData);
    onAssign(assignmentData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assign Reward to User
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {reward && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white">{reward.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {reward.type} • {reward.type === 'discount' ? `${reward.value}%` : `₦${reward.value}`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select User from Rankings *
            </label>
            <select
              value={selectedUser}
              onChange={(e) => {
                console.log('Selected user value:', e.target.value);
                console.log('Selected user text:', e.target.selectedOptions[0]?.text);
                setSelectedUser(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Choose a user from rankings...</option>
              {rankingData?.rankings?.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} (ID: {user._id}) - Rank {user.rank}
                </option>
              )) || []}
            </select>
            {rankingData?.rankings?.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No users in rankings</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Add any notes about this reward assignment..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!selectedUser}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Assign Reward
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddPointsModal = ({ rankingData, onSubmit, onCancel }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [points, setPoints] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser || !points || parseInt(points) <= 0) return;

    const user = rankingData?.rankings?.find(u => u._id === selectedUser);
    if (user) {
      onSubmit(user, points);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Points to User
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select User *
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Choose a user...</option>
              {rankingData?.rankings?.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} (Rank {user.rank}, Current Points: {user.points || 0})
                </option>
              )) || []}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Points to Add *
            </label>
            <input
              type="number"
              min="1"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter number of points"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!selectedUser || !points}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Add Points
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RewardForm = ({ reward, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: reward?.name || '',
    description: reward?.description || '',
    type: reward?.type || 'discount',
    value: reward?.value || '',
    unit: reward?.unit || 'percentage',
    rank: reward?.rank || '',
    isActive: reward?.isActive ?? true,
    autoAssign: reward?.autoAssign ?? true,
    maxRedemptions: reward?.maxRedemptions || '',
    validUntil: reward?.validUntil ? new Date(reward.validUntil).toISOString().split('T')[0] : '',
    conditions: {
      minTransactions: reward?.conditions?.minTransactions || 0,
      minPoints: reward?.conditions?.minPoints || 0,
      minAmount: reward?.conditions?.minAmount || 0,
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      value: parseFloat(formData.value) || formData.value,
      rank: parseInt(formData.rank),
      maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : null,
      validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
    };
    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reward Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter reward name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rank *
          </label>
          <input
            type="number"
            min="1"
            value={formData.rank}
            onChange={(e) => handleChange('rank', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter rank number"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
          placeholder="Describe the reward..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="discount">Discount</option>
            <option value="bonus">Bonus</option>
            <option value="points">Points</option>
            <option value="badge">Badge</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Value *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.value}
            onChange={(e) => handleChange('value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter value"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unit
          </label>
          <select
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="percentage">Percentage</option>
            <option value="amount">Amount</option>
            <option value="points">Points</option>
            <option value="text">Text</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Redemptions
          </label>
          <input
            type="number"
            min="1"
            value={formData.maxRedemptions}
            onChange={(e) => handleChange('maxRedemptions', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Leave empty for unlimited"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valid Until
          </label>
          <input
            type="date"
            value={formData.validUntil}
            onChange={(e) => handleChange('validUntil', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.autoAssign}
            onChange={(e) => handleChange('autoAssign', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-assign</span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {reward ? 'Update Reward' : 'Create Reward'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const AdminRanking = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [showAssignReward, setShowAssignReward] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isResettingSettings, setIsResettingSettings] = useState(false);
  const [isManualResetting, setIsManualResetting] = useState(false);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [selectedUserForPoints, setSelectedUserForPoints] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const queryClient = useQueryClient();

  const { data: rankingData, isLoading, refetch } = useQuery({
    queryKey: ["admin-rankings", selectedPeriod],
    queryFn: () => getRanking(selectedPeriod),
    staleTime: 30000,
  });

  const { data: rewardsData, isLoading: rewardsLoading, refetch: refetchRewards } = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: () => getAllRewards({ page: 1, limit: 50 }),
    staleTime: 30000,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-rewards-analytics"],
    queryFn: getRewardAnalytics,
    staleTime: 60000,
  });

  const { data: settingsData, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-rewards-settings"],
    queryFn: getRewardSettings,
    staleTime: 300000, // 5 minutes
  });

  const { data: systemStatsData, isLoading: systemStatsLoading } = useQuery({
    queryKey: ["admin-rewards-system-stats"],
    queryFn: getRewardSystemStats,
    staleTime: 60000,
  });

  const { data: diceGamesData, isLoading: diceGamesLoading } = useQuery({
    queryKey: ["admin-dice-games"],
    queryFn: () => getAllGames({ page: 1, limit: 20 }),
    staleTime: 30000,
  });

  const { data: diceStatsData, isLoading: diceStatsLoading } = useQuery({
    queryKey: ["admin-dice-stats"],
    queryFn: getGameStats,
    staleTime: 60000,
  });

  const { data: managementWalletData, isLoading: managementWalletLoading } = useQuery({
    queryKey: ["admin-management-wallet"],
    queryFn: getManagementWallet,
    staleTime: 30000,
  });

  // Removed allUsersData query as we're now using ranking users for reward assignment

  const handleAssignReward = (reward) => {
    // Set the selected reward for assignment
    setSelectedReward(reward);
    setShowAssignReward(true);
  };

  const handleViewReward = (reward) => {
    // For now, just show an alert with reward details
    // In a full implementation, this could open a detailed view modal
    alert(`Reward Details:\n\nName: ${reward.name}\nType: ${reward.type}\nValue: ${reward.value}\nRank: ${reward.rank}\nStatus: ${reward.isActive ? 'Active' : 'Inactive'}`);
  };

  const handleSaveSettings = async (settingsData) => {
    setIsSavingSettings(true);
    try {
      await updateRewardSettings(settingsData);
      refetchSettings();
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setIsResettingSettings(true);
      try {
        await resetRewardSettings();
        refetchSettings();
        alert('Settings reset to defaults successfully!');
      } catch (error) {
        console.error('Error resetting settings:', error);
        alert('Failed to reset settings. Please try again.');
      } finally {
        setIsResettingSettings(false);
      }
    }
  };

  const handleManualResetRankings = async () => {
    if (window.confirm('Are you sure you want to manually reset all user rankings? This will reset weekly points and achievements for all users.')) {
      setIsManualResetting(true);
      try {
        await manualResetRankings();
        refetch(); // Refresh the rankings data
        alert('Rankings reset successfully!');
      } catch (error) {
        console.error('Error resetting rankings:', error);
        alert('Failed to reset rankings. Please try again.');
      } finally {
        setIsManualResetting(false);
      }
    }
  };

  const handleExportRankings = async () => {
    try {
      const response = await exportRankingsToCSV(selectedPeriod);
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'text/csv' });
      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rankings-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting rankings:', error);
      alert('Failed to export rankings. Please try again.');
    }
  };

  const handleAddPoints = (user) => {
    setSelectedUserForPoints(user);
    setShowAddPoints(true);
  };

  const handleSubmitPoints = async () => {
    if (!selectedUserForPoints || !pointsToAdd || parseInt(pointsToAdd) <= 0) {
      alert('Please select a user and enter a valid number of points.');
      return;
    }

    try {
      await addPoint({
        userId: selectedUserForPoints._id,
        pointsToAdd: parseInt(pointsToAdd)
      });
      setShowAddPoints(false);
      setSelectedUserForPoints(null);
      setPointsToAdd('');
      refetch(); // Refresh rankings
      alert('Points added successfully!');
    } catch (error) {
      console.error('Error adding points:', error);
      alert('Failed to add points. Please try again.');
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FaChartLine },
    { id: "leaderboard", label: "Leaderboard", icon: FaTrophy },
    { id: "rewards", label: "Rewards", icon: FaGift },
    { id: "assignments", label: "Assignments", icon: FaUserPlus },
    { id: "analytics", label: "Analytics", icon: FaUsers },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

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

  const getRewardTier = (rank) => {
    if (rank === 1) return { tier: "Champion", color: "bg-yellow-500", bonus: 500, discount: 15 };
    if (rank === 2) return { tier: "Runner-up", color: "bg-gray-400", bonus: 300, discount: 12 };
    if (rank === 3) return { tier: "Third Place", color: "bg-amber-600", bonus: 200, discount: 10 };
    if (rank <= 5) return { tier: "Top 5", color: "bg-blue-500", bonus: 100, discount: 5 };
    if (rank <= 10) return { tier: "Top 10", color: "bg-green-500", bonus: 50, discount: 3 };
    return { tier: "Participant", color: "bg-gray-500", bonus: 0, discount: 0 };
  };

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 md:gap-3">
            <FaTrophy className="text-yellow-500 text-lg md:text-xl" />
            Ranking Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Manage user rankings, rewards, and competition settings
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm"
          >
            <FaSync className="text-xs md:text-sm" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExportRankings}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs md:text-sm"
          >
            <FaDownload className="text-xs md:text-sm" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddPoints(true)}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs md:text-sm"
          >
            <FaPlus className="text-xs md:text-sm" />
            <span className="hidden sm:inline">Add Points</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2 md:gap-4">
        {["weekly", "monthly", "all-time"].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-xs md:text-sm ${
              selectedPeriod === period
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1).replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav className="flex space-x-4 md:space-x-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 md:gap-2 py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon className="text-xs md:text-sm" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Stats Cards */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Participants</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                    {rankingData?.rankings?.length || 0}
                  </p>
                </div>
                <FaUsers className="text-blue-500 text-lg md:text-2xl" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Top Performer</p>
                  <p className="text-sm md:text-lg font-bold text-gray-900 dark:text-white truncate">
                    {rankingData?.rankings?.[0]?.username || "N/A"}
                  </p>
                </div>
                <FaCrown className="text-yellow-500 text-lg md:text-2xl" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                    {rankingData?.rankings?.reduce((sum, user) => sum + user.transactionCount, 0) || 0}
                  </p>
                </div>
                <FaChartLine className="text-green-500 text-lg md:text-2xl" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Next Reset</p>
                  <p className="text-lg md:text-lg font-bold text-gray-900 dark:text-white">
                    {rankingData?.countdown ? Math.floor(rankingData.countdown / 86400) + "d" : "N/A"}
                  </p>
                </div>
                <FaCalendarAlt className="text-purple-500 text-lg md:text-2xl" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Current Leaderboard</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reward Tier
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Bonus
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rankingData?.rankings?.map((user, index) => {
                    const rank = index + 1;
                    const reward = getRewardTier(rank);
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getRankIcon(rank)}
                            <span className="ml-1 md:ml-2 text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                              #{rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate max-w-20 md:max-w-none">
                            {user.username}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm text-gray-900 dark:text-white">
                            {user.transactionCount}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <span className={`inline-flex px-1 md:px-2 py-1 text-xs font-semibold rounded-full ${reward.color} text-white`}>
                            {reward.tier}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm text-gray-900 dark:text-white">
                            {reward.bonus > 0 ? `₦${reward.bonus}` : "N/A"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "rewards" && (
          <div className="space-y-6">
            {/* Reward Management Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Reward Management
              </h3>
              <button
                onClick={() => setShowCreateReward(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="text-sm" />
                Create Reward
              </button>
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewardsLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">Loading rewards...</div>
                </div>
              ) : rewardsData?.rewards?.length > 0 ? (
                rewardsData.rewards.map((reward) => (
                  <div key={reward._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getRankIcon(reward.rank)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {reward.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Rank #{reward.rank}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingReward(reward)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete the reward "${reward.name}"?`)) {
                              try {
                                await deleteReward(reward._id);
                                refetchRewards();
                                alert('Reward deleted successfully!');
                              } catch (error) {
                                console.error('Error deleting reward:', error);
                                alert('Failed to delete reward. Please try again.');
                              }
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                        <span className="font-semibold text-blue-600 capitalize">{reward.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Value</span>
                        <span className="font-semibold text-purple-600">
                          {reward.type === 'discount' ? `${reward.value}%` :
                           reward.type === 'bonus' ? `₦${reward.value}` :
                           reward.value}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          reward.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {reward.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAssignReward(reward)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Assign to User
                        </button>
                        <button
                          onClick={() => handleViewReward(reward)}
                          className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <FaEye className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 mb-4">No rewards found</div>
                  <button
                    onClick={() => setShowCreateReward(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Reward
                  </button>
                </div>
              )}
            </div>

            {/* Create/Edit Reward Modal */}
            {(showCreateReward || editingReward) && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {editingReward ? 'Edit Reward' : 'Create New Reward'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowCreateReward(false);
                        setEditingReward(null);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  </div>

                  <RewardForm
                    reward={editingReward}
                    onSubmit={async (formData) => {
                      try {
                        if (editingReward) {
                          await updateReward(editingReward._id, formData);
                        } else {
                          await createReward(formData);
                        }
                        refetchRewards();
                        setShowCreateReward(false);
                        setEditingReward(null);
                      } catch (error) {
                        console.error('Error saving reward:', error);
                        // Handle error (show toast, etc.)
                      }
                    }}
                    onCancel={() => {
                      setShowCreateReward(false);
                      setEditingReward(null);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Reward Assignments
              </h3>
              <button
                onClick={() => setShowAssignReward(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaUserPlus className="text-sm" />
                Assign Reward
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Assignments
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Assigned Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {rankingData?.rankings?.slice(0, 5).map((user, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            Rank {user.rank} Reward
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Eligible
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            Auto-assigned
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAssignReward(rewardsData?.rewards?.[0] || { _id: 'sample-reward-id', name: `Rank ${user.rank} Reward`, type: 'discount', value: 10, rank: user.rank })}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              Assign
                            </button>
                            <button
                              onClick={() => handleViewReward({ name: `Rank ${user.rank} Reward`, type: 'discount', value: 10, rank: user.rank, isActive: true })}
                              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No users available for reward assignment
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaTrophy className="text-yellow-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Rewards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsLoading ? '...' : (analyticsData?.overview?.totalRewards || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaUsers className="text-blue-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Rewards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsLoading ? '...' : (analyticsData?.overview?.activeRewards || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaCheck className="text-green-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Redemptions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsLoading ? '...' : (analyticsData?.overview?.totalRedemptions || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaGift className="text-purple-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending Redemptions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsLoading ? '...' : (analyticsData?.overview?.pendingRedemptions || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Reward Type Distribution
                </h3>
                {analyticsLoading ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Loading analytics...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analyticsData?.rewardTypeStats?.map((stat, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {stat._id}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {stat.count}
                        </span>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No reward type data available
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Monthly Redemptions
                </h3>
                {analyticsLoading ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Loading analytics...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analyticsData?.monthlyRedemptions?.slice(0, 6).map((month, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {month._id}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {month.count}
                        </span>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No monthly data available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* System Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaUsers className="text-blue-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {systemStatsLoading ? '...' : (systemStatsData?.stats?.totalUsers || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaGift className="text-purple-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Rewards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {systemStatsLoading ? '...' : (systemStatsData?.stats?.totalRewards || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaCheck className="text-green-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Redemptions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {systemStatsLoading ? '...' : (systemStatsData?.stats?.redeemedRewards || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaChartLine className="text-orange-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Redemption Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {systemStatsLoading ? '...' : `${systemStatsData?.stats?.redemptionRate || 0}%`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Reward System Settings
              </h3>

              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">Loading settings...</div>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveSettings(settingsData?.settings || {}); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reset Frequency
                    </label>
                    <select
                      defaultValue={settingsData?.settings?.ranking?.resetFrequency || 'weekly'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="weekly">Weekly (Sunday)</option>
                      <option value="monthly">Monthly (1st)</option>
                      <option value="never">Never</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maximum Leaderboard Size
                    </label>
                    <input
                      type="number"
                      defaultValue="10"
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Points per Transaction
                    </label>
                    <input
                      type="number"
                      defaultValue={settingsData?.settings?.ranking?.pointsPerTransaction || 10}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Transactions for Ranking
                    </label>
                    <input
                      type="number"
                      defaultValue="1"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                    Reward Settings
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Auto-assign Rewards
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked={settingsData?.settings?.autoAssignment?.enabled ?? true}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          Automatically assign rewards when users reach ranks
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reward Expiration (days)
                      </label>
                      <input
                        type="number"
                        defaultValue="30"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                    Notification Settings
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={settingsData?.settings?.notifications?.rewardAssigned ?? true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        Notify users when they receive rewards
                      </span>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={settingsData?.settings?.notifications?.milestoneReached ?? true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        Send weekly ranking summary emails
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    disabled={isResettingSettings}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isResettingSettings ? 'Resetting...' : 'Reset to Defaults'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSavingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                System Actions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleManualResetRankings}
                  disabled={isManualResetting}
                  className="p-4 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <FaSync className={`text-red-500 text-xl ${isManualResetting ? 'animate-spin' : ''}`} />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {isManualResetting ? 'Resetting...' : 'Manual Reset Rankings'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Reset all user rankings and points manually</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleExportRankings}
                  className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FaDownload className="text-green-500 text-xl" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Export Rankings</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Download current rankings as CSV</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dice-game" && (
          <div className="space-y-6">
            {/* Dice Game Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaGamepad className="text-purple-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Games</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {diceStatsLoading ? '...' : (diceStatsData?.stats?.totalGames || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaTrophy className="text-yellow-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Wins</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {diceStatsLoading ? '...' : (diceStatsData?.stats?.totalWins || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaWallet className="text-green-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">House Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₦{managementWalletLoading ? '...' : (managementWalletData?.balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaChartLine className="text-blue-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {diceStatsLoading ? '...' : `${diceStatsData?.stats?.winRate || 0}%`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Games Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Games</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Dice Roll
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Result
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Winnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {diceGamesLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          Loading games...
                        </td>
                      </tr>
                    ) : diceGamesData?.games?.length > 0 ? (
                      diceGamesData.games.map((game) => (
                        <tr key={game._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {game.user?.username || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {game.dice1} + {game.dice2}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              game.gameResult === 'win'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {game.gameResult.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {game.gameResult === 'win' ? `+₦${game.winnings}` : `-₦${game.entryFee}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(game.playedAt).toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No games played yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Management Wallet Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Management Wallet
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ₦{managementWalletLoading ? '...' : (managementWalletData?.balance || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ₦{managementWalletLoading ? '...' : (managementWalletData?.availableForWithdrawal || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available for Withdrawal</p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {managementWalletLoading ? '...' : (managementWalletData?.totalGames || 0)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Games Played</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Withdraw Funds</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Transfer funds from management wallet to your account
                    </p>
                  </div>
                  <button
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    onClick={() => alert('Withdrawal functionality will be implemented soon!')}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Reward Modal */}
        {showAssignReward && (
          <AssignRewardModal
            reward={selectedReward}
            rankingData={rankingData}
            onAssign={async (assignmentData) => {
              try {
                await assignRewardToUser(assignmentData);
                refetchRewards();
                setShowAssignReward(false);
                setSelectedReward(null);
                alert('Reward assigned successfully!');
              } catch (error) {
                console.error('Error assigning reward:', error);
                alert('Failed to assign reward. Please try again.');
              }
            }}
            onCancel={() => {
              setShowAssignReward(false);
              setSelectedReward(null);
            }}
          />
        )}

        {/* Add Points Modal */}
        {showAddPoints && (
          <AddPointsModal
            rankingData={rankingData}
            onSubmit={async (user, points) => {
              try {
                await addPoint({
                  userId: user._id,
                  pointsToAdd: parseInt(points)
                });
                setShowAddPoints(false);
                setSelectedUserForPoints(null);
                setPointsToAdd('');
                refetch(); // Refresh rankings
                alert('Points added successfully!');
              } catch (error) {
                console.error('Error adding points:', error);
                alert('Failed to add points. Please try again.');
              }
            }}
            onCancel={() => {
              setShowAddPoints(false);
              setSelectedUserForPoints(null);
              setPointsToAdd('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminRanking;