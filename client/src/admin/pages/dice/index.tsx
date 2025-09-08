import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaGamepad,
  FaTrophy,
  FaUsers,
  FaChartLine,
  FaWallet,
  FaDownload,
  FaSync,
  FaEye,
  FaTrash,
  FaTimes,
  FaCheck,
  FaCog,
  FaSave,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import {
  getAllGames,
  getGameStats,
  getManagementWallet,
  withdrawManagementFunds,
  getBanks,
  verifyDiceBankAccount,
  getDiceGameSettings,
  updateDiceGameSettings,
  resetDiceGameSettings,
} from "../../../api";

const AdminDiceGame = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    bankCode: '',
    accountName: ''
  });
  const [banks, setBanks] = useState([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    gameEnabled: true,
    entryFee: 10,
    winAmount: 1000,
    maintenanceMode: false,
    minBalanceRequired: 10,
    maxDailyGames: 100,
    houseEdge: 97.22, // 1/36 win probability = 97.22% house edge
    notifications: {
      emailEnabled: true,
      largeWinAlert: true,
      suspiciousActivity: true
    },
    riskManagement: {
      maxLossPerHour: 50000,
      maxWinPerHour: 100000,
      autoShutdown: true
    }
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  const { data: diceGames, isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ["admin-dice-games"],
    queryFn: () => getAllGames({ page: 1, limit: 50 }),
    staleTime: 30000,
  });

  const { data: diceStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dice-stats"],
    queryFn: getGameStats,
    staleTime: 60000,
  });

  const { data: managementWallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ["admin-management-wallet"],
    queryFn: getManagementWallet,
    staleTime: 30000,
  });

  const { data: diceSettings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-dice-settings"],
    queryFn: getDiceGameSettings,
    staleTime: 60000,
  });

  // Sync settings with loaded data
  React.useEffect(() => {
    if (diceSettings?.settings) {
      setSettings(diceSettings.settings);
    }
  }, [diceSettings]);

  // Load banks when modal opens
  const loadBanks = async () => {
    try {
      const bankData = await getBanks();
      setBanks(bankData.data || []);
    } catch (error) {
      console.error("Error loading banks:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawForm.amount || !withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.bankCode || !withdrawForm.accountName) {
      alert("Please fill in all fields");
      return;
    }

    if (parseFloat(withdrawForm.amount) > (managementWallet?.availableForWithdrawal || 0)) {
      alert("Insufficient funds for withdrawal");
      return;
    }

    setIsWithdrawing(true);
    try {
      await withdrawManagementFunds({
        amount: parseFloat(withdrawForm.amount),
        bankName: withdrawForm.bankName,
        accountNumber: withdrawForm.accountNumber,
        bankCode: withdrawForm.bankCode,
        accountName: withdrawForm.accountName,
      });

      alert("Withdrawal initiated successfully!");
      setShowWithdrawModal(false);
      setWithdrawForm({
        amount: '',
        bankName: '',
        accountNumber: '',
        bankCode: '',
        accountName: ''
      });
      refetchWallet(); // Refresh wallet balance
    } catch (error) {
      alert(error.message || "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleBankSelect = (bank) => {
    setWithdrawForm(prev => ({
      ...prev,
      bankName: bank.label || bank.name,
      bankCode: bank.code
    }));

    // Auto-populate business owner account if UBA is selected
    if (bank.code === "033") { // United Bank for Africa
      setWithdrawForm(prev => ({
        ...prev,
        accountNumber: "2147044567",
        accountName: "ANDRETI OGECHUKWUKA OBUBU"
      }));
    }
  };

  const handleAccountNumberChange = async (accountNumber) => {
    setWithdrawForm(prev => ({ ...prev, accountNumber }));

    if (accountNumber.length === 10 && withdrawForm.bankCode) {
      try {
        const verification = await verifyDiceBankAccount(accountNumber, withdrawForm.bankCode);
        if (verification && verification.account_name) {
          setWithdrawForm(prev => ({
            ...prev,
            accountName: verification.account_name
          }));
        }
      } catch (error) {
        console.error("Account verification failed:", error);
        // Don't show error to user, just don't auto-populate
      }
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateDiceGameSettings(settings);
      refetchSettings(); // Refresh settings data
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings: " + error.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm("Are you sure you want to reset all settings to defaults?")) {
      setIsSavingSettings(true);
      try {
        await resetDiceGameSettings();
        refetchSettings(); // Refresh settings data
        alert("Settings reset to defaults successfully!");
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
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FaChartLine },
    { id: "games", label: "Recent Games", icon: FaGamepad },
    { id: "analytics", label: "Analytics", icon: FaTrophy },
    { id: "wallet", label: "Management Wallet", icon: FaWallet },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FaGamepad className="text-purple-500" />
            Dice Game Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor dice game activity, revenue, and player statistics
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => refetchGames()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaSync className="text-sm" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <FaDownload className="text-sm" />
            Export Data
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon className="text-sm" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Games</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : (diceStats?.stats?.totalGames || 0)}
                  </p>
                </div>
                <FaGamepad className="text-purple-500 text-2xl" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Wins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : (diceStats?.stats?.totalWins || 0)}
                  </p>
                </div>
                <FaTrophy className="text-yellow-500 text-2xl" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">House Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₦{walletLoading ? '...' : (managementWallet?.balance || 0).toLocaleString()}
                  </p>
                </div>
                <FaWallet className="text-green-500 text-2xl" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : `${diceStats?.stats?.winRate || 0}%`}
                  </p>
                </div>
                <FaChartLine className="text-blue-500 text-2xl" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "games" && (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {gamesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Loading games...
                      </td>
                    </tr>
                  ) : diceGames?.games?.length > 0 ? (
                    diceGames.games.map((game) => (
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors">
                              <FaEye className="text-sm" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors">
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No games played yet
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
                  <FaGamepad className="text-purple-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Games</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? '...' : (diceStats?.stats?.totalGames || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaUsers className="text-blue-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Players</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? '...' : (diceStats?.stats?.activePlayers || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaTrophy className="text-green-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Winnings Paid</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₦{statsLoading ? '...' : (diceStats?.stats?.totalWinnings || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FaChartLine className="text-orange-500 text-2xl" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">House Edge</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? '...' : `${diceStats?.stats?.houseEdge || 0}%`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Game Results Distribution
                </h3>
                {statsLoading ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Loading analytics...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Wins</span>
                      <span className="font-semibold text-green-600">
                        {diceStats?.stats?.totalWins || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Losses</span>
                      <span className="font-semibold text-red-600">
                        {(diceStats?.stats?.totalGames || 0) - (diceStats?.stats?.totalWins || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
                      <span className="font-semibold text-blue-600">
                        {diceStats?.stats?.winRate || 0}%
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Entry Fees</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₦{((diceStats?.stats?.totalGames || 0) * 10).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Winnings Paid</span>
                      <span className="font-semibold text-green-600">
                        ₦{(diceStats?.stats?.totalWinnings || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">House Profit</span>
                      <span className="font-semibold text-purple-600">
                        ₦{((diceStats?.stats?.totalGames || 0) * 10 - (diceStats?.stats?.totalWinnings || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="space-y-6">
            {/* Management Wallet Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Management Wallet
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ₦{walletLoading ? '...' : (managementWallet?.balance || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ₦{walletLoading ? '...' : (managementWallet?.availableForWithdrawal || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available for Withdrawal</p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {walletLoading ? '...' : (managementWallet?.totalGames || 0)}
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
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      setShowWithdrawModal(true);
                      loadBanks();
                    }}
                    disabled={(managementWallet?.availableForWithdrawal || 0) <= 0}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* Wallet Transaction History */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Recent Transactions
              </h3>

              <div className="space-y-4">
                {walletLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading transactions...
                  </div>
                ) : managementWallet?.transactions?.length > 0 ? (
                  managementWallet.transactions.slice(0, 10).map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.type === 'credit' ? 'Game Loss' : 'Withdrawal'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleString()}
                        </p>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No transactions yet
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
                Game Configuration
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
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Enable Dice Game
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
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Maintenance Mode (Disable all games)
                    </span>
                  </div>
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
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Win Amount (Points)
                  </label>
                  <input
                    type="number"
                    value={settings.winAmount}
                    onChange={(e) => handleSettingsChange('winAmount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="100"
                    max="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Balance Required (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.minBalanceRequired}
                    onChange={(e) => handleSettingsChange('minBalanceRequired', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Daily Games per User
                  </label>
                  <input
                    type="number"
                    value={settings.maxDailyGames}
                    onChange={(e) => handleSettingsChange('maxDailyGames', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="1000"
                  />
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
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Alert on Large Wins (≥₦50,000)
                  </span>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.suspiciousActivity}
                    onChange={(e) => handleSettingsChange('notifications.suspiciousActivity', e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Alert on Suspicious Activity
                  </span>
                </div>
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

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.riskManagement.autoShutdown}
                      onChange={(e) => handleSettingsChange('riskManagement.autoShutdown', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Auto-shutdown on Risk Threshold Breach
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Statistics Info */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Current Game Statistics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {settings.houseEdge}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">House Edge</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    (Theoretical advantage)
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    ₦{settings.entryFee}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Entry Fee</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Cost per game
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {settings.winAmount.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Win Amount</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Points awarded
                  </p>
                </div>
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
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaSave className="text-sm" />
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Withdraw Management Funds
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Available Balance */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Available Balance: ₦{managementWallet?.availableForWithdrawal?.toLocaleString() || 0}
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter amount"
                  min="1"
                  max={managementWallet?.availableForWithdrawal || 0}
                />
              </div>

              {/* Bank Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Bank
                </label>
                <select
                  value={withdrawForm.bankCode}
                  onChange={(e) => {
                    const selectedBank = banks.find(bank => bank.code === e.target.value);
                    if (selectedBank) {
                      handleBankSelect({ label: selectedBank.name, code: selectedBank.code });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose a bank...</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={withdrawForm.accountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter account number"
                  maxLength={10}
                />
                {withdrawForm.accountNumber === "2147044567" && withdrawForm.bankCode === "033" ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                    <FaCheck className="mr-1" />
                    Business owner account detected - no verification needed
                  </p>
                ) : withdrawForm.accountNumber.length === 10 && withdrawForm.bankCode ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Account will be verified automatically
                  </p>
                ) : null}
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={withdrawForm.accountName}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter account name"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
                </button>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiceGame;