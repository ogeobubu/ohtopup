import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaHistory,
  FaTrophy,
  FaWallet,
  FaChartLine,
  FaCoins,
  FaGamepad,
  FaCalculator,
  FaLightbulb,
  FaBullseye,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { getUser, getWallet, playBetDiceGame, getBetDiceHistory, getBetDiceStats, getBetDiceSettings } from "../api";

const BetDiceGame = () => {
  const [activeTab, setActiveTab] = useState("play");
  const [isRolling, setIsRolling] = useState(false);
  const [dice, setDice] = useState([1, 1, 1, 1, 1, 1]);
  const [gameResult, setGameResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [currentOdds, setCurrentOdds] = useState(2.0);
  const [betAmount, setBetAmount] = useState(50);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [selectedDiceCount, setSelectedDiceCount] = useState(2);
  const [showHints, setShowHints] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  // Difficulty levels configuration
  const difficultyLevels = {
    easy: {
      name: "Easy",
      description: "Roll any double (1,1 to 6,6)",
      oddsRange: [1.2, 1.8],
      color: "green",
      probability: 16.67, // 6/36
      targetDescription: "Any matching pair"
    },
    medium: {
      name: "Medium",
      description: "Roll double 4 or higher (4,4 ; 5,5 ; 6,6)",
      oddsRange: [2.0, 3.5],
      color: "blue",
      probability: 8.33, // 3/36
      targetDescription: "Double 4, 5, or 6"
    },
    hard: {
      name: "Hard",
      description: "Roll double 5 or higher (5,5 ; 6,6)",
      oddsRange: [3.0, 6.0],
      color: "orange",
      probability: 5.56, // 2/36
      targetDescription: "Double 5 or 6"
    },
    expert: {
      name: "Expert",
      description: "Roll double 6 only (6,6)",
      oddsRange: [5.0, 12.0],
      color: "red",
      probability: 2.78, // 1/36
      targetDescription: "Double 6 only"
    },
    legendary: {
      name: "Legendary",
      description: "Roll three of a kind (with 3+ dice)",
      oddsRange: [8.0, 20.0],
      color: "purple",
      probability: 4.63, // Varies by dice count
      targetDescription: "Three matching dice"
    }
  };

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
    queryKey: ["bet-dice-history"],
    queryFn: () => getBetDiceHistory({ page: 1, limit: 10 }),
    staleTime: 30000,
  });

  const { data: gameStats } = useQuery({
    queryKey: ["bet-dice-stats"],
    queryFn: getBetDiceStats,
    staleTime: 30000,
  });

  const { data: gameSettings } = useQuery({
    queryKey: ["bet-dice-settings"],
    queryFn: getBetDiceSettings,
    staleTime: 60000,
  });

  // Generate random odds based on difficulty
  const generateRandomOdds = (difficulty) => {
    const level = difficultyLevels[difficulty];
    const min = level.oddsRange[0];
    const max = level.oddsRange[1];
    const randomOdds = Math.random() * (max - min) + min;
    return Math.round(randomOdds * 100) / 100; // Round to 2 decimal places
  };

  // Update odds when difficulty changes
  useEffect(() => {
    setCurrentOdds(generateRandomOdds(selectedDifficulty));
  }, [selectedDifficulty]);

  const playGameMutation = useMutation({
    mutationFn: playBetDiceGame,
    onSuccess: (data) => {
      // Animate dice rolling
      setIsRolling(true);
      setShowResult(false);

      // Simulate dice rolling animation
      const rollInterval = setInterval(() => {
        const newDice = Array.from({ length: selectedDiceCount }, () =>
          Math.floor(Math.random() * 6) + 1
        );
        setDice(newDice);
      }, 100);

      setTimeout(() => {
        clearInterval(rollInterval);
        // Use the actual API response data
        setDice(data.game.dice);
        setGameResult(data);
        setIsRolling(false);
        setShowResult(true);

        // Generate new odds for next round
        setCurrentOdds(generateRandomOdds(selectedDifficulty));

        // Refresh wallet data, history and stats
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["bet-dice-history"] });
        queryClient.invalidateQueries({ queryKey: ["bet-dice-stats"] });
      }, 2000);
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Failed to play game");
    },
  });

  const handlePlayGame = () => {
    // Check if game is enabled
    if (!gameSettings?.settings?.gameEnabled) {
      alert("Bet Dice game is currently disabled. Please try again later.");
      return;
    }

    // Check if maintenance mode is active
    if (gameSettings?.settings?.maintenanceMode) {
      alert("Bet Dice game is under maintenance. Please try again later.");
      return;
    }

    // Validate bet amount
    const minBet = gameSettings?.settings?.minBetAmount || 10;
    const maxBet = gameSettings?.settings?.maxBetAmount || 1000;

    if (betAmount < minBet) {
      alert(`Minimum bet amount is ₦${minBet}`);
      return;
    }

    if (betAmount > maxBet) {
      alert(`Maximum bet amount is ₦${maxBet}`);
      return;
    }

    // Check balance requirement
    const totalCost = betAmount + (gameSettings?.settings?.entryFee || 0);
    if (!walletData?.balance || walletData.balance < totalCost) {
      alert(`Insufficient balance! You need at least ₦${totalCost} to play.`);
      return;
    }

    playGameMutation.mutate({
      betAmount,
      odds: currentOdds,
      difficulty: selectedDifficulty,
      diceCount: selectedDiceCount
    });
  };

  const getDiceIcon = (value) => {
    const icons = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    return icons[value - 1];
  };


  const getResultBg = (result) => {
    return result?.game?.isWin
      ? "bg-gradient-to-r from-green-500 to-emerald-600"
      : "bg-gradient-to-r from-red-500 to-pink-600";
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: "border-green-500 bg-green-50 dark:bg-green-900/20",
      medium: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
      hard: "border-orange-500 bg-orange-50 dark:bg-orange-900/20",
      expert: "border-red-500 bg-red-50 dark:bg-red-900/20",
      legendary: "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
    };
    return colors[difficulty] || colors.medium;
  };

  const calculateExpectedValue = () => {
    const level = difficultyLevels[selectedDifficulty];
    const probability = level.probability / 100;
    const potentialWin = betAmount * currentOdds;
    const expectedValue = (probability * potentialWin) - ((1 - probability) * betAmount);
    return expectedValue.toFixed(2);
  };

  const getBettingAdvice = () => {
    const expectedValue = parseFloat(calculateExpectedValue());
    if (expectedValue > 0) return { advice: "Good bet!", color: "text-green-600", icon: FaArrowUp };
    if (expectedValue < -betAmount * 0.5) return { advice: "High risk!", color: "text-red-600", icon: FaArrowDown };
    return { advice: "Fair bet", color: "text-yellow-600", icon: FaMinus };
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 md:py-8 px-3 md:px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2 md:gap-3">
            <FaBullseye className="text-yellow-300 text-lg md:text-xl" />
            <span className="truncate">Bet Dice Game</span>
            <FaBullseye className="text-yellow-300 text-lg md:text-xl" />
          </h1>
          <p className="text-indigo-100 text-sm md:text-lg px-2">
            Strategic betting with dynamic odds • Win big or lose smart!
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Wallet Balance */}
        <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <FaWallet className="text-green-500 text-lg md:text-xl" />
              <div>
                <p className="text-xs md:text-sm opacity-75">Wallet Balance</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  ₦{walletData?.balance?.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs md:text-sm opacity-75">Entry Fee</p>
              <p className="text-base md:text-lg font-semibold">₦{gameSettings?.settings?.entryFee || 0}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 md:mb-6 flex justify-center px-2">
          <div className={`flex flex-wrap rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'} p-1 w-full max-w-md md:max-w-none`}>
            {[
              { id: "play", label: "Play Game", shortLabel: "Play", icon: FaPlay },
              { id: "history", label: "History", shortLabel: "History", icon: FaHistory },
              { id: "stats", label: "Statistics", shortLabel: "Stats", icon: FaChartLine },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`px-3 md:px-6 py-2 rounded-md font-medium transition-all duration-300 flex items-center gap-1 md:gap-2 flex-1 justify-center text-xs md:text-sm ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : `${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:bg-gray-100`
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="text-xs md:text-sm" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Play Game Tab */}
        {activeTab === "play" && (
          <div className={`rounded-xl shadow-lg p-4 md:p-8 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Game Status Messages */}
            {!gameSettings?.settings?.gameEnabled && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                <h3 className="text-base md:text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  🎮 Game Currently Disabled
                </h3>
                <p className="text-sm md:text-base text-red-700 dark:text-red-300">
                  The bet dice game is temporarily disabled by administrators. Please check back later.
                </p>
              </div>
            )}

            {gameSettings?.settings?.maintenanceMode && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🔧 Maintenance Mode
                </h3>
                <p className="text-sm md:text-base text-yellow-700 dark:text-yellow-300">
                  The bet dice game is currently under maintenance. We'll be back soon!
                </p>
              </div>
            )}

            <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Strategic Dice Betting</h2>

            {/* Odds Display */}
            <div className={`mb-6 md:mb-8 p-4 md:p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'} border-2 border-indigo-200`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaCalculator className="text-indigo-600 text-lg" />
                <h3 className="text-lg md:text-xl font-bold text-indigo-600">Current Odds</h3>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-indigo-700 mb-2">
                {currentOdds}x
              </div>
              <p className="text-sm text-indigo-600">
                Potential payout: ₦{(betAmount * currentOdds).toLocaleString()}
              </p>
            </div>

            {/* Game Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Difficulty Selection */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FaBullseye className="text-gray-600" />
                  Difficulty Level
                </h4>
                <div className="space-y-2">
                  {Object.entries(difficultyLevels).map(([key, level]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedDifficulty(key)}
                      className={`w-full p-3 rounded-lg border-2 transition-all ${
                        selectedDifficulty === key
                          ? getDifficultyColor(key)
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <div className="font-semibold">{level.name}</div>
                          <div className="text-sm opacity-75">{level.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{level.oddsRange[0]}x - {level.oddsRange[1]}x</div>
                          <div className="text-sm opacity-75">{level.probability}% win</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet Configuration */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FaCoins className="text-yellow-600" />
                  Betting Setup
                </h4>

                {/* Dice Count Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Number of Dice</label>
                  <select
                    value={selectedDiceCount}
                    onChange={(e) => setSelectedDiceCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={2}>2 Dice</option>
                    <option value={3}>3 Dice</option>
                    <option value={4}>4 Dice</option>
                    <option value={5}>5 Dice</option>
                    <option value={6}>6 Dice</option>
                  </select>
                </div>

                {/* Bet Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Bet Amount (₦)</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={gameSettings?.settings?.minBetAmount || 10}
                    max={gameSettings?.settings?.maxBetAmount || 1000}
                    placeholder="Enter bet amount"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Min: ₦{gameSettings?.settings?.minBetAmount || 10} • Max: ₦{gameSettings?.settings?.maxBetAmount || 1000}
                  </div>
                </div>

                {/* Betting Advice */}
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Expected Value:</span>
                    <span className={`font-bold ${parseFloat(calculateExpectedValue()) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{calculateExpectedValue()}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {React.createElement(getBettingAdvice().icon, { className: `text-sm ${getBettingAdvice().color}` })}
                    <span className={`text-sm font-medium ${getBettingAdvice().color}`}>
                      {getBettingAdvice().advice}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Display */}
            <div className={`mb-6 md:mb-8 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="font-semibold mb-2">Current Target</h4>
              <p className="text-lg">{difficultyLevels[selectedDifficulty].targetDescription}</p>
              <p className="text-sm opacity-75 mt-1">
                Win Chance: {difficultyLevels[selectedDifficulty].probability}%
              </p>
            </div>

            {/* Dice Display */}
            <div className="flex justify-center items-center gap-2 md:gap-4 mb-6 md:mb-8 flex-wrap">
              {Array.from({ length: selectedDiceCount }, (_, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center text-3xl md:text-4xl ${
                    isRolling ? 'animate-bounce' : ''
                  } ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                >
                  {getDiceIcon(dice[index])}
                </div>
              ))}
            </div>

            {/* Play Button */}
            <div className="flex justify-center items-center px-4 mb-6">
              <button
                onClick={handlePlayGame}
                disabled={isRolling || playGameMutation.isPending || !gameSettings?.settings?.gameEnabled || gameSettings?.settings?.maintenanceMode}
                className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg md:text-xl font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                {isRolling ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-white"></div>
                    <span className="text-sm md:text-base">Rolling...</span>
                  </div>
                ) : playGameMutation.isPending ? (
                  <span className="text-sm md:text-base">Processing...</span>
                ) : !gameSettings?.settings?.gameEnabled ? (
                  <div className="flex items-center gap-1 md:gap-2">
                    <FaPlay className="text-sm md:text-base" />
                    <span className="text-sm md:text-base">Game Disabled</span>
                  </div>
                ) : gameSettings?.settings?.maintenanceMode ? (
                  <div className="flex items-center gap-1 md:gap-2">
                    <FaPlay className="text-sm md:text-base" />
                    <span className="text-sm md:text-base">Under Maintenance</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 md:gap-2">
                    <FaPlay className="text-sm md:text-base" />
                    <span className="text-sm md:text-base hidden sm:inline">
                      Bet ₦{betAmount} • Play Game ({currentOdds}x odds)
                    </span>
                    <span className="text-sm md:text-base sm:hidden">
                      Bet ₦{betAmount} ({currentOdds}x)
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Hints Toggle */}
            <div className="mb-6">
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FaLightbulb className={showHints ? "text-yellow-500" : "text-gray-500"} />
                <span className="text-sm">{showHints ? "Hide" : "Show"} Betting Tips</span>
              </button>
            </div>

            {/* Hints Panel */}
            {showHints && (
              <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} border border-blue-200`}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FaLightbulb className="text-yellow-500" />
                  Betting Strategy Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">🎯 Odds Analysis</h5>
                    <ul className="space-y-1 text-xs">
                      <li>• Higher odds = Higher risk, higher reward</li>
                      <li>• Compare odds to win probability</li>
                      <li>• Look for positive expected value</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">💰 Bankroll Management</h5>
                    <ul className="space-y-1 text-xs">
                      <li>• Never bet more than you can afford to lose</li>
                      <li>• Start with smaller bets to learn patterns</li>
                      <li>• Take profits when ahead</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Game Result */}
            {showResult && gameResult && (
              <div className={`mt-6 md:mt-8 p-4 md:p-6 rounded-lg ${getResultBg(gameResult)} text-white`}>
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                  {gameResult.game.isWin ? "🎉 Congratulations!" : "😞 Better Luck Next Time!"}
                </h3>
                <div className="text-base md:text-lg mb-3 md:mb-4">
                  You rolled: <strong>{gameResult.game.dice.join(", ")}</strong>
                </div>
                <div className="text-lg md:text-xl">
                  {gameResult.game.isWin ? (
                    <div className="space-y-2">
                      <p>🎉 You won <strong>₦{(gameResult.game.winnings || 0).toLocaleString()}</strong>!</p>
                      <p>Bet: ₦{betAmount} • Odds: {currentOdds}x • Payout: ₦{(betAmount * currentOdds).toLocaleString()}</p>
                      <div className="bg-white/20 rounded-lg p-2 md:p-3 mt-3">
                        <p className="text-sm opacity-90">💰 New balance: ₦{(gameResult.newBalance || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p>You lost <strong>₦{betAmount + (gameSettings?.settings?.entryFee || 0)}</strong></p>
                      <p className="text-sm mt-2">New balance: ₦{(gameResult.newBalance || 0).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Game Rules */}
            <div className={`mt-6 md:mt-8 p-4 md:p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="text-base md:text-lg font-bold mb-3 md:mb-4">How to Play</h4>
              <div className="text-left space-y-1 md:space-y-2 text-sm md:text-base">
                <p>1. Choose your difficulty level and number of dice</p>
                <p>2. Set your bet amount within the allowed range</p>
                <p>3. Review the current odds and potential payout</p>
                <p>4. Click "Play Game" to roll the dice</p>
                <p>5. Win by achieving the target combination for your difficulty level</p>
                <p>6. Payout = Bet Amount × Odds Multiplier</p>
                <p>7. Use the betting tips to make strategic decisions</p>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className={`rounded-xl shadow-lg p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <FaHistory className="text-base md:text-lg" />
              Betting History
            </h2>

            {gameHistory?.games?.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {gameHistory.games.map((game) => (
                  <div key={game._id} className={`p-3 md:p-4 rounded-lg border ${
                    game.gameResult === 'win'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1 md:gap-2">
                        {game.dice.map((die, index) => (
                          <span key={index} className="text-xl md:text-2xl">{getDiceIcon(die)}</span>
                        ))}
                        <span className="font-bold text-sm md:text-base">
                          {game.dice.join(", ")}
                        </span>
                      </div>
                      <div className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold ${
                        game.gameResult === 'win'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {game.gameResult.toUpperCase()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm">
                      <div>
                        <span className="opacity-75">Bet:</span>
                        <span className="font-semibold ml-1">₦{game.betAmount}</span>
                      </div>
                      <div>
                        <span className="opacity-75">Odds:</span>
                        <span className="font-semibold ml-1">{game.odds}x</span>
                      </div>
                      <div>
                        <span className="opacity-75">Difficulty:</span>
                        <span className="font-semibold ml-1 capitalize">{game.difficulty}</span>
                      </div>
                      <div>
                        <span className="opacity-75">Result:</span>
                        <span className={`font-semibold ml-1 ${
                          game.gameResult === 'win' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {game.gameResult === 'win' ? `+₦${game.winnings || 0}` : `-₦${game.betAmount || 0}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2 text-xs opacity-75">
                      {new Date(game.playedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400">
                <FaHistory className="text-3xl md:text-4xl mx-auto mb-3 opacity-50" />
                <p className="text-sm md:text-base">No games played yet</p>
                <p className="text-xs md:text-sm mt-1">Start betting to see your history!</p>
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <div className={`rounded-xl shadow-lg p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <FaChartLine className="text-base md:text-lg" />
              Betting Statistics
            </h2>

            {gameStats?.stats ? (
              <div className="space-y-6">
                {/* Overall Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                  <div className={`p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <FaGamepad className="text-indigo-500 text-sm md:text-base" />
                      <span className="font-semibold text-xs md:text-sm">Total Bets</span>
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-indigo-600">
                      {gameStats.stats.totalGames}
                    </div>
                  </div>

                  <div className={`p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <FaTrophy className="text-green-500 text-sm md:text-base" />
                      <span className="font-semibold text-xs md:text-sm">Wins</span>
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-green-600">
                      {gameStats.stats.totalWins}
                    </div>
                  </div>

                  <div className={`p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <FaCoins className="text-red-500 text-sm md:text-base" />
                      <span className="font-semibold text-xs md:text-sm">Win Rate</span>
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-red-600">
                      {gameStats.stats.winRate}%
                    </div>
                  </div>

                  <div className={`p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <FaWallet className="text-purple-500 text-sm md:text-base" />
                      <span className="font-semibold text-xs md:text-sm">Net Profit</span>
                    </div>
                    <div className={`text-lg md:text-2xl font-bold ${
                      (gameStats.stats.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₦{(gameStats.stats.netProfit || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Performance by Difficulty */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance by Difficulty</h3>
                  <div className="space-y-3">
                    {Object.entries(difficultyLevels).map(([key, level]) => {
                      const difficultyStats = gameStats.stats.difficultyStats?.[key] || { games: 0, wins: 0, winRate: 0 };
                      return (
                        <div key={key} className={`p-4 rounded-lg border-2 ${getDifficultyColor(key)}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">{level.name}</span>
                            <span className="text-sm opacity-75">
                              {difficultyStats.games} games • {difficultyStats.winRate}% win rate
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-current h-2 rounded-full"
                              style={{
                                width: `${Math.min(difficultyStats.winRate * 3, 100)}%`,
                                color: level.color === 'green' ? '#10B981' :
                                       level.color === 'blue' ? '#3B82F6' :
                                       level.color === 'orange' ? '#F59E0B' :
                                       level.color === 'red' ? '#EF4444' : '#8B5CF6'
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Betting Insights */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FaLightbulb className="text-yellow-500" />
                    Betting Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Most Profitable Difficulty:</p>
                      <p className="text-green-600">
                        {gameStats.stats.mostProfitableDifficulty || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Average Bet Size:</p>
                      <p>₦{(gameStats.stats.averageBetSize || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Largest Win:</p>
                      <p className="text-green-600">
                        ₦{(gameStats.stats.largestWin || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Best Win Streak:</p>
                      <p className="text-blue-600">
                        {(gameStats.stats.bestWinStreak || 0)} games
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400">
                <FaChartLine className="text-3xl md:text-4xl mx-auto mb-3 opacity-50" />
                <p className="text-sm md:text-base">No statistics available yet</p>
                <p className="text-xs md:text-sm mt-1">Play some games to see your stats!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BetDiceGame;