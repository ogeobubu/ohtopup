import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FaDice,
  FaPlay,
  FaHistory,
  FaTrophy,
  FaWallet,
  FaChartLine,
  FaCrown,
  FaMedal,
  FaStar,
  FaCoins,
  FaGamepad
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { getUser, getWallet, playDiceGame, getUserGameHistory, getUserGameStats, getDiceGameSettings } from "../../api";

const DiceGame = () => {
  const [activeTab, setActiveTab] = useState("play");
  const [isRolling, setIsRolling] = useState(false);
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [gameResult, setGameResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 60000,
  });

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
    staleTime: 30000,
  });

  const { data: gameHistory } = useQuery({
    queryKey: ["dice-history"],
    queryFn: () => getUserGameHistory({ page: 1, limit: 10 }),
    staleTime: 30000,
  });

  const { data: gameStats } = useQuery({
    queryKey: ["dice-stats"],
    queryFn: getUserGameStats,
    staleTime: 30000,
  });

  const { data: gameSettings } = useQuery({
    queryKey: ["dice-settings"],
    queryFn: getDiceGameSettings,
    staleTime: 60000,
  });

  const playGameMutation = useMutation({
    mutationFn: playDiceGame,
    onSuccess: (data) => {
      // Animate dice rolling
      setIsRolling(true);
      setShowResult(false);

      // Simulate dice rolling animation
      const rollInterval = setInterval(() => {
        setDice1(Math.floor(Math.random() * 6) + 1);
        setDice2(Math.floor(Math.random() * 6) + 1);
      }, 100);

      setTimeout(() => {
        clearInterval(rollInterval);
        setDice1(data.game.dice1);
        setDice2(data.game.dice2);
        setGameResult(data);
        setIsRolling(false);
        setShowResult(true);

        // Refresh wallet data, history and stats
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["dice-history"] });
        queryClient.invalidateQueries({ queryKey: ["dice-stats"] });
      }, 2000);
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Failed to play game");
    },
  });


  const handlePlayGame = () => {
    // Check if game is enabled
    if (!gameSettings?.settings?.gameEnabled) {
      alert("Dice game is currently disabled. Please try again later.");
      return;
    }

    // Check if maintenance mode is active
    if (gameSettings?.settings?.maintenanceMode) {
      alert("Dice game is under maintenance. Please try again later.");
      return;
    }

    // Check balance requirement
    const minBalance = gameSettings?.settings?.minBalanceRequired || 10;
    if (!walletData?.balance || walletData.balance < minBalance) {
      alert(`Insufficient balance! You need at least ₦${minBalance} to play.`);
      return;
    }

    playGameMutation.mutate();
  };


  const getDiceIcon = (value) => {
    const icons = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    return icons[value - 1];
  };

  const getResultColor = (result) => {
    return result?.game?.isWin ? "text-green-600" : "text-red-600";
  };

  const getResultBg = (result) => {
    return result?.game?.isWin
      ? "bg-gradient-to-r from-green-500 to-emerald-600"
      : "bg-gradient-to-r from-red-500 to-pink-600";
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <FaGamepad className="text-yellow-300" />
            Dice Game
            <FaGamepad className="text-yellow-300" />
          </h1>
          <p className="text-purple-100 text-lg">
            Roll double 6 to win {gameSettings?.settings?.winAmount?.toLocaleString() || '1,000'} Points! Entry fee: ₦{gameSettings?.settings?.entryFee || 10}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Wallet Balance */}
        <div className={`mb-6 p-4 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaWallet className="text-green-500 text-xl" />
              <div>
                <p className="text-sm opacity-75">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{walletData?.balance?.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">Entry Fee</p>
              <p className="text-lg font-semibold">₦{gameSettings?.settings?.entryFee || 10}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex justify-center">
          <div className={`flex rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'} p-1`}>
            {[
              { id: "play", label: "Play Game", icon: FaPlay },
              { id: "history", label: "History", icon: FaHistory },
              { id: "stats", label: "Statistics", icon: FaChartLine },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white shadow-md"
                    : `${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:bg-gray-100`
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="text-sm" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Play Game Tab */}
        {activeTab === "play" && (
          <div className={`rounded-xl shadow-lg p-8 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Game Status Messages */}
            {!gameSettings?.settings?.gameEnabled && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  🎮 Game Currently Disabled
                </h3>
                <p className="text-red-700 dark:text-red-300">
                  The dice game is temporarily disabled by administrators. Please check back later.
                </p>
              </div>
            )}

            {gameSettings?.settings?.maintenanceMode && (
              <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🔧 Maintenance Mode
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300">
                  The dice game is currently under maintenance. We'll be back soon!
                </p>
              </div>
            )}

            <h2 className="text-3xl font-bold mb-6">Roll the Dice!</h2>
            <p className="text-lg mb-8 opacity-75">
              Roll <strong>double 6</strong> to win <strong>{gameSettings?.settings?.winAmount?.toLocaleString() || '1,000'} Points</strong>
            </p>

            {/* Dice Display */}
            <div className="flex justify-center items-center gap-8 mb-8">
              <div className={`w-24 h-24 rounded-lg flex items-center justify-center text-6xl ${
                isRolling ? 'animate-bounce' : ''
              } ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {getDiceIcon(dice1)}
              </div>
              <div className={`w-24 h-24 rounded-lg flex items-center justify-center text-6xl ${
                isRolling ? 'animate-bounce' : ''
              } ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {getDiceIcon(dice2)}
              </div>
            </div>

            {/* Play Button */}
            <div className="flex justify-center items-center">
              <button
                onClick={handlePlayGame}
                disabled={isRolling || playGameMutation.isPending || !gameSettings?.settings?.gameEnabled || gameSettings?.settings?.maintenanceMode}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {isRolling ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Rolling...
                  </div>
                ) : playGameMutation.isPending ? (
                  "Processing..."
                ) : !gameSettings?.settings?.gameEnabled ? (
                  <div className="flex items-center gap-2">
                    <FaPlay />
                    Game Disabled
                  </div>
                ) : gameSettings?.settings?.maintenanceMode ? (
                  <div className="flex items-center gap-2">
                    <FaPlay />
                    Under Maintenance
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FaPlay />
                    Play Game (₦{gameSettings?.settings?.entryFee || 10})
                  </div>
                )}
              </button>
            </div>

            {/* Game Result */}
            {showResult && gameResult && (
              <div className={`mt-8 p-6 rounded-lg ${getResultBg(gameResult)} text-white`}>
                <h3 className="text-2xl font-bold mb-4">
                  {gameResult.game.isWin ? "🎉 Congratulations!" : "😞 Better Luck Next Time!"}
                </h3>
                <div className="text-lg mb-4">
                  You rolled: <strong>{gameResult.game.dice1} + {gameResult.game.dice2}</strong>
                </div>
                <div className="text-xl">
                  {gameResult.game.isWin ? (
                    <div className="space-y-2">
                      <p>🎉 You won <strong>{gameSettings?.settings?.winAmount?.toLocaleString() || '1,000'} Points</strong>!</p>
                      <div className="bg-white/20 rounded-lg p-3 mt-3">
                        {gameResult.newPointsBalance && (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">⭐ Points Transferred Immediately:</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-white/10 rounded px-2 py-1">
                                <div className="font-bold">{gameResult.newPointsBalance.currentPoints}</div>
                                <div className="opacity-75">Current</div>
                              </div>
                              <div className="bg-white/10 rounded px-2 py-1">
                                <div className="font-bold">{gameResult.newPointsBalance.totalPoints}</div>
                                <div className="opacity-75">Total</div>
                              </div>
                              <div className="bg-white/10 rounded px-2 py-1">
                                <div className="font-bold">{gameResult.newPointsBalance.weeklyPoints}</div>
                                <div className="opacity-75">Weekly</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {gameResult.transferStatus && (
                          <p className="text-xs mt-2 opacity-90">✅ {gameResult.transferStatus}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p>You lost <strong>₦{gameSettings?.settings?.entryFee || 10}</strong></p>
                      <p className="text-sm mt-2">New balance: ₦{gameResult.newBalance.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Game Rules */}
            <div className={`mt-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="text-lg font-bold mb-4">How to Play</h4>
              <div className="text-left space-y-2">
                <p>1. Click "Play Game" to roll the dice (costs ₦{gameSettings?.settings?.entryFee || 10})</p>
                <p>2. If you roll double 6 (6, 6), you win {gameSettings?.settings?.winAmount?.toLocaleString() || '1,000'} Points!</p>
                <p>3. Points are transferred to your account immediately upon winning</p>
                <p>4. If you roll anything else, you lose the ₦{gameSettings?.settings?.entryFee || 10} entry fee</p>
                <p>5. Use points to redeem rewards and unlock special features</p>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaHistory />
              Game History
            </h2>

            {gameHistory?.games?.length > 0 ? (
              <div className="space-y-4">
                {gameHistory.games.map((game) => (
                  <div key={game._id} className={`p-4 rounded-lg border ${
                    game.gameResult === 'win'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getDiceIcon(game.dice1)}</span>
                        <span className="text-2xl">{getDiceIcon(game.dice2)}</span>
                        <span className="font-bold">
                          {game.dice1} + {game.dice2}
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        game.gameResult === 'win'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {game.gameResult.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>
                        {game.gameResult === 'win' ? `Won ${game.winnings} Points` : `Lost ₦${game.entryFee}`}
                      </span>
                      <span className="opacity-75">
                        {new Date(game.playedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaHistory className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No games played yet</p>
                <p className="text-sm mt-1">Start playing to see your history!</p>
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <div className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaChartLine />
              Your Statistics
            </h2>

            {gameStats?.stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FaGamepad className="text-blue-500" />
                    <span className="font-semibold">Total Games</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {gameStats.stats.totalGames}
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FaTrophy className="text-green-500" />
                    <span className="font-semibold">Wins</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {gameStats.stats.totalWins}
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FaCoins className="text-red-500" />
                    <span className="font-semibold">Win Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {gameStats.stats.winRate}%
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FaWallet className="text-purple-500" />
                    <span className="font-semibold">Net Profit</span>
                  </div>
                  <div className={`text-2xl font-bold ${
                    gameStats.stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₦{gameStats.stats.netProfit.toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaChartLine className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No statistics available yet</p>
                <p className="text-sm mt-1">Play some games to see your stats!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceGame;