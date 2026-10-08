import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiActivity, FiClock, FiDollarSign, FiInfo, FiPlay, FiShield, FiTarget, FiTrendingUp, FiZap } from "react-icons/fi";
import { getWallet, playBetDiceGame, getBetDiceHistory, getBetDiceStats, getBetDiceSettings } from "../api";
import "./betDice.css";

const DIFFICULTIES = {
  easy: { name: "Easy", short: "Any double", oddsRange: [1.2, 1.8], probability: 16.67, target: "Roll any matching pair", tone: "green" },
  medium: { name: "Medium", short: "Double 4+", oddsRange: [2.0, 3.5], probability: 8.33, target: "Roll double 4, 5, or 6", tone: "blue" },
  hard: { name: "Hard", short: "Double 5+", oddsRange: [3.0, 6.0], probability: 5.56, target: "Roll double 5 or 6", tone: "amber" },
  expert: { name: "Expert", short: "Double six", oddsRange: [5.0, 12.0], probability: 2.78, target: "Roll double 6", tone: "red" },
  legendary: { name: "Legendary", short: "Triple match", oddsRange: [8.0, 20.0], probability: 4.63, target: "Roll three matching dice", tone: "purple" },
};

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const QUICK_BETS = [50, 100, 250, 500];
const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;

const BetDiceGame = () => {
  const [activeTab, setActiveTab] = useState("play");
  const [isRolling, setIsRolling] = useState(false);
  const [dice, setDice] = useState([1, 1]);
  const [gameResult, setGameResult] = useState(null);
  const [currentOdds, setCurrentOdds] = useState(2);
  const [betAmount, setBetAmount] = useState(50);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [selectedDiceCount, setSelectedDiceCount] = useState(2);
  const [notice, setNotice] = useState("");
  const resultRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: walletData } = useQuery({ queryKey: ["wallet"], queryFn: getWallet, staleTime: 30000 });
  const { data: gameHistory } = useQuery({ queryKey: ["bet-dice-history"], queryFn: () => getBetDiceHistory({ page: 1, limit: 10 }), staleTime: 30000 });
  const { data: gameStats } = useQuery({ queryKey: ["bet-dice-stats"], queryFn: getBetDiceStats, staleTime: 30000 });
  const { data: gameSettings } = useQuery({ queryKey: ["bet-dice-settings"], queryFn: getBetDiceSettings, staleTime: 60000 });

  const settings = gameSettings?.settings;
  const entryFee = settings?.entryFee || 0;
  const minBet = settings?.minBetAmount || 10;
  const maxBet = settings?.maxBetAmount || 1000;
  const balance = walletData?.balance || 0;
  const totalStake = betAmount + entryFee;
  const potentialPayout = betAmount * currentOdds;
  const selectedLevel = DIFFICULTIES[selectedDifficulty];
  const gameUnavailable = !settings?.gameEnabled || settings?.maintenanceMode;

  const enhancedStats = useMemo(() => {
    if (!gameStats?.stats) return null;
    const stats = { ...gameStats.stats };
    stats.difficultyStats = stats.difficultyStats || {};
    return stats;
  }, [gameStats]);

  const generateRandomOdds = (difficulty) => {
    const level = DIFFICULTIES[difficulty];
    return Math.round((Math.random() * (level.oddsRange[1] - level.oddsRange[0]) + level.oddsRange[0]) * 100) / 100;
  };

  useEffect(() => {
    setCurrentOdds(generateRandomOdds(selectedDifficulty));
    setGameResult(null);
  }, [selectedDifficulty]);

  useEffect(() => {
    if (selectedDifficulty === "legendary" && selectedDiceCount < 3) setSelectedDiceCount(3);
  }, [selectedDifficulty, selectedDiceCount]);

  useEffect(() => {
    setDice((current) => Array.from({ length: selectedDiceCount }, (_, index) => current[index] || Math.floor(Math.random() * 6) + 1));
  }, [selectedDiceCount]);

  const playGameMutation = useMutation({
    mutationFn: playBetDiceGame,
    onSuccess: (data) => {
      setNotice("");
      setGameResult(null);
      setIsRolling(true);
      const rollInterval = window.setInterval(() => {
        setDice(Array.from({ length: selectedDiceCount }, () => Math.floor(Math.random() * 6) + 1));
      }, 85);
      window.setTimeout(() => {
        window.clearInterval(rollInterval);
        setDice(data.game.dice);
        setGameResult(data);
        setIsRolling(false);
        setCurrentOdds(generateRandomOdds(selectedDifficulty));
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["bet-dice-history"] });
        queryClient.invalidateQueries({ queryKey: ["bet-dice-stats"] });
        window.setTimeout(() => resultRef.current?.focus(), 100);
      }, 1700);
    },
    onError: (error) => {
      setIsRolling(false);
      setNotice(error.response?.data?.message || "The roll could not be completed. Please try again.");
    },
  });

  const handlePlayGame = () => {
    setNotice("");
    if (!settings?.gameEnabled) return setNotice("The game is currently disabled.");
    if (settings?.maintenanceMode) return setNotice("The table is under maintenance. Please check back shortly.");
    if (betAmount < minBet) return setNotice(`The minimum bet is ${formatMoney(minBet)}.`);
    if (betAmount > maxBet) return setNotice(`The maximum bet is ${formatMoney(maxBet)}.`);
    if (balance < totalStake) return setNotice(`You need ${formatMoney(totalStake)} to make this roll.`);
    playGameMutation.mutate({ betAmount, odds: currentOdds, difficulty: selectedDifficulty, diceCount: selectedDiceCount });
  };

  const setSafeBet = (amount) => setBetAmount(Math.min(maxBet, Math.max(minBet, Number(amount) || 0)));

  return (
    <div className="bet-game-page">
      <header className="bet-game-hero">
        <div>
          <div className="bet-game-eyebrow"><span className="bet-live-dot" /> Live dice table</div>
          <h1>Roll. Match. Win.</h1>
          <p>Choose your challenge, place your stake, and test your luck.</p>
        </div>
        <div className="bet-balance-card" aria-label={`Available balance ${formatMoney(balance)}`}>
          <span>Available balance</span><strong>{formatMoney(balance)}</strong><small><FiShield /> Secure wallet play</small>
        </div>
      </header>

      <nav className="bet-tabs" aria-label="Game sections">
        {[{ id: "play", label: "Play game", icon: FiPlay }, { id: "history", label: "My history", icon: FiClock }, { id: "stats", label: "Performance", icon: FiActivity }].map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeTab === id ? "active" : ""} aria-pressed={activeTab === id} onClick={() => setActiveTab(id)}><Icon /> {label}</button>
        ))}
      </nav>

      {activeTab === "play" && (
        <div className="bet-play-layout">
          <main className="bet-table-card">
            <div className="bet-table-topline">
              <span><FiTarget /> Your target</span><strong>{selectedLevel.target}</strong><span className={`bet-difficulty-badge ${selectedLevel.tone}`}>{selectedLevel.name}</span>
            </div>
            <div className={`bet-dice-arena ${isRolling ? "is-rolling" : ""} ${gameResult ? (gameResult.game.isWin ? "is-win" : "is-loss") : ""}`}>
              <div className="bet-arena-glow" /><div className="bet-odds-pill"><FiZap /> {currentOdds}x multiplier</div>
              <div className="bet-dice-row" aria-live="polite" aria-label={isRolling ? "Dice are rolling" : `Dice show ${dice.join(", ")}`}>
                {Array.from({ length: selectedDiceCount }, (_, index) => <div className="bet-die" key={index} style={{ "--die-delay": `${index * 70}ms` }} aria-hidden="true">{DICE_FACES[(dice[index] || 1) - 1]}</div>)}
              </div>
              <p className="bet-arena-status">{isRolling ? "Rolling the dice…" : gameResult ? `You rolled ${gameResult.game.dice.join(" · ")}` : "The table is ready"}</p>
            </div>

            {notice && <div className="bet-notice" role="alert"><FiInfo /> {notice}</div>}
            {gameResult && !isRolling && (
              <div ref={resultRef} tabIndex={-1} className={`bet-result ${gameResult.game.isWin ? "win" : "loss"}`}>
                <div className="bet-result-icon">{gameResult.game.isWin ? "🏆" : "↻"}</div>
                <div><span>{gameResult.game.isWin ? "Winning roll" : "Not this time"}</span><strong>{gameResult.game.isWin ? `You won ${formatMoney(gameResult.game.winnings)}` : `You lost ${formatMoney(totalStake)}`}</strong><small>New balance: {formatMoney(gameResult.newBalance)}</small></div>
                {!gameResult.game.isWin && <button onClick={handlePlayGame}>Roll again</button>}
              </div>
            )}

            <div className="bet-round-summary">
              <div><span>Total stake</span><strong>{formatMoney(totalStake)}</strong></div><div><span>Win chance</span><strong>{selectedLevel.probability}%</strong></div><div className="highlight"><span>Potential return</span><strong>{formatMoney(potentialPayout)}</strong></div>
            </div>
            <button className="bet-roll-button" onClick={handlePlayGame} disabled={isRolling || playGameMutation.isPending || gameUnavailable}>
              <span className="bet-roll-button-icon">{isRolling ? "⚄" : "⚂"}</span><span>{isRolling ? "Rolling…" : playGameMutation.isPending ? "Preparing roll…" : `Roll for ${formatMoney(totalStake)}`}</span>{!isRolling && <small>Win up to {formatMoney(potentialPayout)}</small>}
            </button>
            <p className="bet-fair-note"><FiShield /> Your result is generated securely on the server. Set a comfortable limit and play responsibly.</p>
          </main>

          <aside className="bet-controls-card">
            <div className="bet-control-heading"><div><span>Game setup</span><h2>Build your roll</h2></div><span className="bet-entry-fee">+{formatMoney(entryFee)} fee</span></div>
            <fieldset className="bet-fieldset"><legend>1. Pick a challenge</legend><div className="bet-difficulty-grid">
              {Object.entries(DIFFICULTIES).map(([key, level]) => <button type="button" key={key} className={`${selectedDifficulty === key ? "active" : ""} ${level.tone}`} onClick={() => setSelectedDifficulty(key)}><span>{level.name}</span><small>{level.short}</small><strong>{level.oddsRange[0]}–{level.oddsRange[1]}x</strong></button>)}
            </div></fieldset>
            <fieldset className="bet-fieldset"><legend>2. Choose your dice</legend><div className="bet-dice-count">
              {[2, 3, 4, 5, 6].map((count) => <button type="button" key={count} disabled={selectedDifficulty === "legendary" && count < 3} className={selectedDiceCount === count ? "active" : ""} onClick={() => setSelectedDiceCount(count)}>{count}</button>)}
            </div>{selectedDifficulty === "legendary" && <small className="bet-helper">Legendary mode needs at least 3 dice.</small>}</fieldset>
            <fieldset className="bet-fieldset"><legend>3. Place your bet</legend><div className="bet-amount-input"><span>₦</span><input aria-label="Bet amount" type="number" value={betAmount} min={minBet} max={maxBet} onChange={(event) => setBetAmount(Math.max(0, Number(event.target.value) || 0))} /><button type="button" onClick={() => setSafeBet(Math.min(maxBet, Math.floor(balance - entryFee)))}>MAX</button></div>
              <div className="bet-quick-bets">{QUICK_BETS.map((amount) => <button type="button" key={amount} onClick={() => setSafeBet(amount)}>{formatMoney(amount)}</button>)}</div><div className="bet-bet-limits"><span>Min {formatMoney(minBet)}</span><span>Max {formatMoney(maxBet)}</span></div>
            </fieldset>
            <div className="bet-tip"><FiTrendingUp /><div><strong>Round preview</strong><span>A win returns {formatMoney(potentialPayout)} at the current {currentOdds}x odds.</span></div></div>
          </aside>
        </div>
      )}

      {activeTab === "history" && <section className="bet-panel" aria-label="Betting history">
        <div className="bet-panel-header"><div><span>Last 10 rounds</span><h2>Your game history</h2></div><FiClock /></div>
        {gameHistory?.games?.length > 0 ? <div className="bet-history-list">{gameHistory.games.map((game) => <article key={game._id} className="bet-history-row">
          <div className="bet-history-dice">{game.dice.map((value, index) => <span key={index}>{DICE_FACES[value - 1]}</span>)}</div><div><strong>{DIFFICULTIES[game.difficulty]?.name || game.difficulty}</strong><small>{new Date(game.playedAt).toLocaleString()}</small></div><div><span>Stake</span><strong>{formatMoney(game.betAmount)}</strong></div><div><span>Odds</span><strong>{game.odds}x</strong></div><div className={game.gameResult === "win" ? "bet-history-win" : "bet-history-loss"}><span>{game.gameResult}</span><strong>{game.gameResult === "win" ? `+${formatMoney(game.winnings)}` : `-${formatMoney(game.betAmount)}`}</strong></div>
        </article>)}</div> : <div className="bet-empty"><span>⚂</span><h3>No rolls yet</h3><p>Your latest games will appear here.</p><button onClick={() => setActiveTab("play")}>Play your first game</button></div>}
      </section>}

      {activeTab === "stats" && <section className="bet-panel" aria-label="Betting statistics">
        <div className="bet-panel-header"><div><span>Player dashboard</span><h2>Your performance</h2></div><FiActivity /></div>
        {enhancedStats ? <><div className="bet-stat-grid">{[
          { label: "Total rolls", value: enhancedStats.totalGames || 0, icon: FiTarget }, { label: "Wins", value: enhancedStats.totalWins || 0, icon: FiZap }, { label: "Win rate", value: `${Number(enhancedStats.winRate || 0).toFixed(1)}%`, icon: FiActivity }, { label: "Net result", value: formatMoney(enhancedStats.netProfit), icon: FiDollarSign },
        ].map(({ label, value, icon: Icon }) => <div key={label}><Icon /><span>{label}</span><strong>{value}</strong></div>)}</div><div className="bet-performance-list"><h3>Performance by challenge</h3>{Object.entries(DIFFICULTIES).map(([key, level]) => {
          const data = enhancedStats.difficultyStats?.[key] || { games: 0, winRate: 0, netProfit: 0 };
          return <div key={key}><span className={`bet-level-dot ${level.tone}`} /><strong>{level.name}</strong><span>{data.games} games</span><span>{Number(data.winRate || 0).toFixed(1)}% wins</span><b className={data.netProfit >= 0 ? "positive" : "negative"}>{formatMoney(data.netProfit)}</b></div>;
        })}</div></> : <div className="bet-empty"><span>◎</span><h3>No stats yet</h3><p>Play a few rounds to build your performance dashboard.</p><button onClick={() => setActiveTab("play")}>Go to the table</button></div>}
      </section>}
    </div>
  );
};

export default BetDiceGame;
