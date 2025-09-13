import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaGamepad,
  FaTrophy,
  FaUsers,
  FaChartLine,
  FaWallet,
  FaCog,
  FaSave,
  FaSync,
  FaBullseye,
  FaCoins,
  FaCalculator,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import {
  getAllBetDiceGames,
  getBetDiceGameStats,
  getBetDiceSettings,
  updateBetDiceSettings,
  resetBetDiceSettings,
} from "../../api";

const AdminBetDiceGame = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Settings state for betting dice game
  const [settings, setSettings] = useState({
    gameEnabled: true,
    maintenanceMode: false,
    minBetAmount: 10,
    maxBetAmount: 1000,
    entryFee: 0,
    difficultyLevels: {
      easy: {
        enabled: true,
        oddsRange: [1.2, 1.8],
        probability: 16.67
      },
      medium: {
        enabled: true,
        oddsRange: [2.0, 3.5],
        probability: 8.33
      },
      hard: {
        enabled: true,
        oddsRange: [3.0, 6.0],
        probability: 5.56
      },
      expert: {
        enabled: true,
        oddsRange: [5.0, 12.0],
        probability: 2.78
      },
      legendary: {
        enabled: true,
        oddsRange: [8.0, 20.0],
        probability: 4.63
      }
    },
    maxDiceCount: 6,
    notifications: {
      emailEnabled: true,
      largeWinAlert: true,
      suspiciousActivity: true,
      betLimitExceeded: true
    },
    riskManagement: {
      maxLossPerHour: 50000,
      maxWinPerHour: 100000,
      autoShutdown: true,
      maxDailyBetsPerUser: 100
    },
    houseEdge: 5.0, // Target house edge percentage
    analytics: {
      trackBettingPatterns: true,
      generateReports: true,
      alertOnAnomalies: true
    },
    manipulation: {
      enabled: false,
      mode: 'fair',
      bias: 0.5,
      winProbability: 0.0278,
      seed: null,
      adminOnly: true,
      logManipulations: true,
      difficultySettings: {
        easy: { winProbability: 0.1667 },
        medium: { winProbability: 0.0833 },
        hard: { winProbability: 0.0556 },
        expert: { winProbability: 0.0278 },
        legendary: { winProbability: 0.0463 }
      }
    }
  });

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode || false);

  const { data: betDiceGames, isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ["admin-bet-dice-games"],
    queryFn: () => getAllBetDiceGames({ page: 1, limit: 50 }),
    staleTime: 30000,
  });

  const { data: betDiceStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-bet-dice-stats"],
    queryFn: getBetDiceGameStats,
    staleTime: 60000,
  });

  const { data: betDiceSettings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-bet-dice-settings"],
    queryFn: getBetDiceSettings,
    staleTime: 60000,
  });

  // Sync settings with loaded data
  React.useEffect(() => {
    if (betDiceSettings?.settings) {
      setSettings(betDiceSettings.settings);
    } else if (betDiceSettings) {
      setSettings(betDiceSettings);
    }
  }, [betDiceSettings]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateBetDiceSettings(settings);
      refetchSettings();
      alert("Bet Dice settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings: " + error.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm("Are you sure you want to reset all Bet Dice settings to defaults?")) {
      setIsSavingSettings(true);
      try {
        await resetBetDiceSettings();
        refetchSettings();
        alert("Bet Dice settings reset to defaults successfully!");
      } catch (error) {
        alert("Failed to reset settings: " + error.message);
      } finally {
        setIsSavingSettings(false);
      }
    }
  };

  const handleSettingsChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (field.includes('..')) {
        const [grandparent, parent2, child2] = field.split('..');
        setSettings(prev => ({
          ...prev,
          [grandparent]: {
            ...prev[grandparent],
            [parent2]: {
              ...prev[grandparent][parent2],
              [child2]: value
            }
          }
        }));
      } else {
        setSettings(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FaChartLine },
    { id: "games", label: "Recent Games", icon: FaGamepad },
    { id: "analytics", label: "Analytics", icon: FaTrophy },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 md:gap-3">
            <FaBullseye className="text-indigo-500 text-lg md:text-xl" />
            Bet Dice Game Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Monitor strategic betting activity, revenue, and player statistics
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => refetchGames()}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm"
          >
            <FaSync className="text-xs md:text-sm" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
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
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
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
                 <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Bets</p>
                 <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                   {statsLoading ? '...' : (betDiceStats?.stats?.totalGames || 0)}
                 </p>
               </div>
               <FaGamepad className="text-indigo-500 text-lg md:text-2xl" />
             </div>
           </div>

           <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Wins</p>
                 <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                   {statsLoading ? '...' : (betDiceStats?.stats?.totalWins || 0)}
                 </p>
               </div>
               <FaTrophy className="text-yellow-500 text-lg md:text-2xl" />
             </div>
           </div>

           <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">House Revenue</p>
                 <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                   ₦{statsLoading ? '...' : (betDiceStats?.stats?.totalRevenue || 0).toLocaleString()}
                 </p>
               </div>
               <FaWallet className="text-green-500 text-lg md:text-2xl" />
             </div>
           </div>

           <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Avg Bet Size</p>
                 <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                   ₦{statsLoading ? '...' : (betDiceStats?.stats?.averageBetSize || 0).toLocaleString()}
                 </p>
               </div>
               <FaCoins className="text-purple-500 text-lg md:text-2xl" />
             </div>
           </div>
         </div>
        )}

        {activeTab === "games" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Recent Bet Games</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Bet Details
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Payout
                    </th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {gamesLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 md:px-6 py-3 md:py-4 text-center text-gray-500 dark:text-gray-400">
                        Loading games...
                      </td>
                    </tr>
                  ) : betDiceGames?.games?.length > 0 ? (
                    betDiceGames.games.map((game) => (
                      <tr key={game._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate max-w-20 md:max-w-none">
                            {game.user?.username || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm text-gray-900 dark:text-white">
                            ₦{game.betAmount} • {game.odds}x • {game.difficulty}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <span className={`inline-flex px-1 md:px-2 py-1 text-xs font-semibold rounded-full ${
                            game.gameResult === 'win'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {game.gameResult.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm text-gray-900 dark:text-white">
                            {game.gameResult === 'win' ? `+₦${game.winnings}` : `-₦${game.betAmount}`}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm text-gray-900 dark:text-white">
                            {new Date(game.playedAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 md:px-6 py-3 md:py-4 text-center text-gray-500 dark:text-gray-400">
                        No bet games played yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaGamepad className="text-indigo-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Bets</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? '...' : (betDiceStats?.stats?.totalGames || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaUsers className="text-blue-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Bettors</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? '...' : (betDiceStats?.stats?.activePlayers || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaTrophy className="text-green-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Payouts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₦{statsLoading ? '...' : (betDiceStats?.stats?.totalWinnings || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaCalculator className="text-orange-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">House Edge</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? '...' : `${betDiceStats?.stats?.houseEdge || 0}%`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Betting Patterns
                </h3>
                {statsLoading ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Loading analytics...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Most Popular Difficulty</span>
                      <span className="font-semibold text-indigo-600">
                        {betDiceStats?.stats?.mostPopularDifficulty || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Average Odds Taken</span>
                      <span className="font-semibold text-blue-600">
                        {(betDiceStats?.stats?.averageOdds || 0).toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Risk Tolerance</span>
                      <span className="font-semibold text-green-600">
                        {betDiceStats?.stats?.riskTolerance || 'Medium'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Revenue Breakdown
                </h3>
                {statsLoading ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Loading analytics...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Bets Placed</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₦{((betDiceStats?.stats?.totalGames || 0) * (betDiceStats?.stats?.averageBetSize || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Payouts</span>
                      <span className="font-semibold text-green-600">
                        ₦{(betDiceStats?.stats?.totalWinnings || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">House Profit</span>
                      <span className="font-semibold text-purple-600">
                        ₦{((betDiceStats?.stats?.totalGames || 0) * (betDiceStats?.stats?.averageBetSize || 0) - (betDiceStats?.stats?.totalWinnings || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Game Configuration */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Bet Dice Game Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Game Status
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.gameEnabled}
                      onChange={(e) => handleSettingsChange('gameEnabled', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Enable Bet Dice Game
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maintenance Mode
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingsChange('maintenanceMode', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Maintenance Mode (Disable all betting)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Bet Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.minBetAmount}
                    onChange={(e) => handleSettingsChange('minBetAmount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Bet Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.maxBetAmount}
                    onChange={(e) => handleSettingsChange('maxBetAmount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="100"
                    max="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entry Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.entryFee}
                    onChange={(e) => handleSettingsChange('entryFee', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Dice Count
                  </label>
                  <input
                    type="number"
                    value={settings.maxDiceCount}
                    onChange={(e) => handleSettingsChange('maxDiceCount', parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="2"
                    max="6"
                  />
                </div>
              </div>
            </div>

            {/* Difficulty Level Configuration */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Difficulty Level Settings
              </h3>

              <div className="space-y-4">
                {Object.entries(settings.difficultyLevels).map(([key, level]) => (
                  <div key={key} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold capitalize">{key} Level</h4>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={level.enabled}
                          onChange={(e) => handleSettingsChange(`difficultyLevels..${key}..enabled`, e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm">Enabled</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Min Odds</label>
                        <input
                          type="number"
                          step="0.1"
                          value={level.oddsRange[0]}
                          onChange={(e) => handleSettingsChange(`difficultyLevels..${key}..oddsRange`, [parseFloat(e.target.value) || 1, level.oddsRange[1]])}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          min="1"
                          max="50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Odds</label>
                        <input
                          type="number"
                          step="0.1"
                          value={level.oddsRange[1]}
                          onChange={(e) => handleSettingsChange(`difficultyLevels..${key}..oddsRange`, [level.oddsRange[0], parseFloat(e.target.value) || 1])}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          min="1"
                          max="50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Win Probability (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={level.probability}
                          onChange={(e) => handleSettingsChange(`difficultyLevels..${key}..probability`, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Management */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Risk Management
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Loss per Hour (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.riskManagement.maxLossPerHour}
                    onChange={(e) => handleSettingsChange('riskManagement.maxLossPerHour', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1000"
                    max="1000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Win per Hour (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.riskManagement.maxWinPerHour}
                    onChange={(e) => handleSettingsChange('riskManagement.maxWinPerHour', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1000"
                    max="1000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Daily Bets per User
                  </label>
                  <input
                    type="number"
                    value={settings.riskManagement.maxDailyBetsPerUser}
                    onChange={(e) => handleSettingsChange('riskManagement.maxDailyBetsPerUser', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target House Edge (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.houseEdge}
                    onChange={(e) => handleSettingsChange('houseEdge', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="0"
                    max="20"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.riskManagement.autoShutdown}
                      onChange={(e) => handleSettingsChange('riskManagement.autoShutdown', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Auto-shutdown on Risk Threshold Breach
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Notification Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailEnabled}
                    onChange={(e) => handleSettingsChange('notifications.emailEnabled', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Enable Email Notifications
                  </span>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.largeWinAlert}
                    onChange={(e) => handleSettingsChange('notifications.largeWinAlert', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Alert on Large Wins
                  </span>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.suspiciousActivity}
                    onChange={(e) => handleSettingsChange('notifications.suspiciousActivity', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Alert on Suspicious Activity
                  </span>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.betLimitExceeded}
                    onChange={(e) => handleSettingsChange('notifications.betLimitExceeded', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Alert on Bet Limit Exceeded
                  </span>
                </div>
              </div>
            </div>

            {/* Analytics Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Analytics & Reporting
              </h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.analytics.trackBettingPatterns}
                    onChange={(e) => handleSettingsChange('analytics.trackBettingPatterns', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Track Betting Patterns
                  </span>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.analytics.generateReports}
                    onChange={(e) => handleSettingsChange('analytics.generateReports', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Generate Automated Reports
                  </span>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.analytics.alertOnAnomalies}
                    onChange={(e) => handleSettingsChange('analytics.alertOnAnomalies', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Alert on Anomalous Activity
                  </span>
                </div>
              </div>
            </div>

            {/* Bet Dice Game Manipulation */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-red-200 dark:border-red-700">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  🎲 Bet Dice Game Manipulation
                </h3>
                <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                  Admin Only - Advanced Controls
                </span>
              </div>

              <div className="space-y-6">
                {/* Enable Manipulation */}
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-red-800 dark:text-red-200">Enable Outcome Manipulation</h4>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        When enabled, game outcomes can be manipulated according to the settings below
                      </p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.manipulation?.enabled || false}
                        onChange={(e) => handleSettingsChange('manipulation.enabled', e.target.checked)}
                        className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {settings.manipulation?.enabled && (
                  <>
                    {/* Manipulation Mode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Manipulation Mode
                      </label>
                      <select
                        value={settings.manipulation?.mode || 'fair'}
                        onChange={(e) => handleSettingsChange('manipulation.mode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="fair">Fair Play (No Manipulation)</option>
                        <option value="biased_win">Biased Towards Wins</option>
                        <option value="biased_loss">Biased Towards Losses</option>
                        <option value="fixed_win">Always Win</option>
                        <option value="fixed_loss">Always Lose</option>
                        <option value="custom_probability">Custom Win Probability</option>
                        <option value="difficulty_based">Difficulty-Based Probabilities</option>
                      </select>
                    </div>

                    {/* Mode-specific settings */}
                    {(settings.manipulation?.mode === 'biased_win' || settings.manipulation?.mode === 'biased_loss') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Bias Factor (0-1)
                          <span className="text-xs text-gray-500 ml-2">
                            Higher = stronger {settings.manipulation?.mode === 'biased_win' ? 'win' : 'loss'} bias
                          </span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={settings.manipulation?.bias || 0.5}
                          onChange={(e) => handleSettingsChange('manipulation.bias', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {settings.manipulation?.mode === 'custom_probability' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Custom Win Probability (0-1)
                          <span className="text-xs text-gray-500 ml-2">
                            0.0278 = natural probability (varies by difficulty)
                          </span>
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          value={settings.manipulation?.winProbability || 0.0278}
                          onChange={(e) => handleSettingsChange('manipulation.winProbability', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {settings.manipulation?.mode === 'difficulty_based' && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Difficulty-Specific Win Probabilities</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(settings.difficultyLevels).map(([key, level]) => (
                            <div key={key} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                              <label className="block text-sm font-medium mb-2 capitalize">
                                {key} Level Win Probability (0-1)
                              </label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                max="1"
                                value={settings.manipulation?.difficultySettings?.[key]?.winProbability || level.probability / 100}
                                onChange={(e) => handleSettingsChange(`manipulation.difficultySettings..${key}..winProbability`, parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Natural: {(level.probability / 100).toFixed(4)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Random Seed */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Random Seed (Optional)
                        <span className="text-xs text-gray-500 ml-2">
                          For reproducible results - leave empty for true randomness
                        </span>
                      </label>
                      <input
                        type="text"
                        value={settings.manipulation?.seed || ''}
                        onChange={(e) => handleSettingsChange('manipulation.seed', e.target.value)}
                        placeholder="Enter seed string..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Security Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.manipulation?.adminOnly || true}
                          onChange={(e) => handleSettingsChange('manipulation.adminOnly', e.target.checked)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Admin Only Access
                        </span>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.manipulation?.logManipulations || true}
                          onChange={(e) => handleSettingsChange('manipulation.logManipulations', e.target.checked)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Log All Manipulations
                        </span>
                      </div>
                    </div>

                    {/* Current Theoretical Probability */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Theoretical Win Probability</h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Current settings result in approximately{' '}
                        <span className="font-bold">
                          {(() => {
                            const mode = settings.manipulation?.mode || 'fair';
                            switch (mode) {
                              case 'fair': return 'Natural Probabilities';
                              case 'biased_win': return `${((settings.manipulation?.bias || 0.5) * 100).toFixed(1)}%`;
                              case 'biased_loss': return `${(((1 - (settings.manipulation?.bias || 0.5)) * 2.78)).toFixed(2)}%`;
                              case 'fixed_win': return '100%';
                              case 'fixed_loss': return '0%';
                              case 'custom_probability': return `${((settings.manipulation?.winProbability || 0.0278) * 100).toFixed(2)}%`;
                              case 'difficulty_based': return 'Difficulty-Based';
                              default: return 'Natural Probabilities';
                            }
                          })()}
                        </span>
                        {' '}win rate
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Save Settings Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleResetSettings}
                disabled={isSavingSettings}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaSave className="text-sm" />
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBetDiceGame;