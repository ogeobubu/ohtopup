import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getUser, getWallet, playBetDiceGame, getBetDiceHistory, getBetDiceStats, getBetDiceSettings } from "../api";

const BetDiceGame = () => {
  const [activeTab, setActiveTab] = useState("play");
  const [isRolling, setIsRolling] = useState(false);
  const [dice, setDice] = useState([1, 1]);
  const [gameResult, setGameResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [currentOdds, setCurrentOdds] = useState(2.0);
  const [betAmount, setBetAmount] = useState(50);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [selectedDiceCount, setSelectedDiceCount] = useState(2);

  const queryClient = useQueryClient();
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  const difficultyLevels = {
    easy: { name: "Easy", description: "Roll any double", oddsRange: [1.2, 1.8], probability: 16.67, target: "Any matching pair" },
    medium: { name: "Medium", description: "Roll double 4+", oddsRange: [2.0, 3.5], probability: 8.33, target: "Double 4, 5, or 6" },
    hard: { name: "Hard", description: "Roll double 5+", oddsRange: [3.0, 6.0], probability: 5.56, target: "Double 5 or 6" },
    expert: { name: "Expert", description: "Roll double 6", oddsRange: [5.0, 12.0], probability: 2.78, target: "Double 6 only" },
    legendary: { name: "Legendary", description: "Three of a kind", oddsRange: [8.0, 20.0], probability: 4.63, target: "Three matching dice" },
  };

  const { data: userData } = useQuery({ queryKey: ["user"], queryFn: getUser, staleTime: 60000 });
  const { data: walletData } = useQuery({ queryKey: ["wallet"], queryFn: getWallet, staleTime: 30000 });
  const { data: gameHistory } = useQuery({ queryKey: ["bet-dice-history"], queryFn: () => getBetDiceHistory({ page: 1, limit: 10 }), staleTime: 30000 });
  const { data: gameStats } = useQuery({ queryKey: ["bet-dice-stats"], queryFn: getBetDiceStats, staleTime: 30000 });
  const { data: gameSettings } = useQuery({ queryKey: ["bet-dice-settings"], queryFn: getBetDiceSettings, staleTime: 60000 });

  const enhancedStats = useMemo(() => {
    if (!gameStats?.stats) return null;
    const stats = { ...gameStats.stats };
    if (!stats.difficultyStats || Object.keys(stats.difficultyStats).length === 0) {
      stats.difficultyStats = {};
      Object.keys(difficultyLevels).forEach(d => { stats.difficultyStats[d] = { games: 0, wins: 0, winRate: 0, totalBet: 0, totalWon: 0, netProfit: 0 }; });
    }
    return stats;
  }, [gameStats]);

  const generateRandomOdds = (difficulty) => {
    const level = difficultyLevels[difficulty];
    return Math.round((Math.random() * (level.oddsRange[1] - level.oddsRange[0]) + level.oddsRange[0]) * 100) / 100;
  };

  useEffect(() => { setCurrentOdds(generateRandomOdds(selectedDifficulty)); }, [selectedDifficulty]);
  useEffect(() => { if (selectedDifficulty === 'legendary' && selectedDiceCount < 3) setSelectedDiceCount(3); }, [selectedDifficulty, selectedDiceCount]);

  const playGameMutation = useMutation({
    mutationFn: playBetDiceGame,
    onSuccess: (data) => {
      setIsRolling(true); setShowResult(false);
      const rollInterval = setInterval(() => { setDice(Array.from({ length: selectedDiceCount }, () => Math.floor(Math.random() * 6) + 1)); }, 100);
      setTimeout(() => {
        clearInterval(rollInterval); setDice(data.game.dice); setGameResult(data);
        setIsRolling(false); setShowResult(true); setCurrentOdds(generateRandomOdds(selectedDifficulty));
        queryClient.invalidateQueries({ queryKey: ["wallet"] }); queryClient.invalidateQueries({ queryKey: ["bet-dice-history"] }); queryClient.invalidateQueries({ queryKey: ["bet-dice-stats"] });
      }, 2000);
    },
    onError: (error) => { alert(error.response?.data?.message || "Failed to play game"); },
  });

  const handlePlayGame = () => {
    if (!gameSettings?.settings?.gameEnabled) { alert("Game is currently disabled."); return; }
    if (gameSettings?.settings?.maintenanceMode) { alert("Game is under maintenance."); return; }
    if (selectedDifficulty === 'legendary' && selectedDiceCount < 3) { alert("Legendary requires at least 3 dice."); return; }
    const minBet = gameSettings?.settings?.minBetAmount || 10;
    const maxBet = gameSettings?.settings?.maxBetAmount || 1000;
    if (betAmount < minBet) { alert(`Minimum bet is ₦${minBet}`); return; }
    if (betAmount > maxBet) { alert(`Maximum bet is ₦${maxBet}`); return; }
    const totalCost = betAmount + (gameSettings?.settings?.entryFee || 0);
    if (!walletData?.balance || walletData.balance < totalCost) { alert(`Insufficient balance. Need ₦${totalCost}.`); return; }
    playGameMutation.mutate({ betAmount, odds: currentOdds, difficulty: selectedDifficulty, diceCount: selectedDiceCount });
  };

  const getDiceIcon = (value) => ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][value - 1];
  const difficultyColor = (d) => ({ easy: '#27805d', medium: 'var(--ot-accent)', hard: '#d97706', expert: '#ef4444', legendary: '#8b5cf6' }[d] || 'var(--ot-muted)');

  return (
    <div className="ot-dashboard">
      <div className="ot-dashboard-heading"><div><h1>Bet Dice Game</h1><p>Strategic betting with dynamic odds</p></div></div>

      {/* Wallet */}
      <div className="ot-overview" style={{ marginBottom: 24 }}>
        <section className="ot-balance" aria-label="Wallet balance">
          <div className="ot-balance-label">Available balance</div>
          <div className="ot-balance-amount">₦{walletData?.balance?.toLocaleString() || 0}</div>
        </section>
        <section className="ot-panel">
          <div className="ot-panel-heading"><div><h2>Game Info</h2><p>Entry fee and odds.</p></div></div>
          <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '12px 16px', background: 'var(--ot-tint)', borderRadius: 6 }}><div style={{ fontSize: 11, color: 'var(--ot-muted)' }}>Entry Fee</div><div style={{ fontSize: 18, fontWeight: 600 }}>₦{gameSettings?.settings?.entryFee || 0}</div></div>
            <div style={{ padding: '12px 16px', background: 'var(--ot-tint)', borderRadius: 6 }}><div style={{ fontSize: 11, color: 'var(--ot-muted)' }}>Current Odds</div><div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ot-accent)' }}>{currentOdds}x</div></div>
          </div>
        </section>
      </div>

      <nav className="ot-utility-tabs" aria-label="Game sections">
        {[{ id: "play", label: "Play" }, { id: "history", label: "History" }, { id: "stats", label: "Statistics" }].map((tab) => (
          <button key={tab.id} aria-pressed={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </nav>

      {/* Play Tab */}
      {activeTab === "play" && (
        <section className="ot-panel" aria-label="Play game">
          <div className="ot-panel-heading"><div><h2>Strategic Dice Betting</h2><p>Potential payout: ₦{(betAmount * currentOdds).toLocaleString()}</p></div></div>
          <div style={{ padding: '0 24px 24px' }}>
            {!gameSettings?.settings?.gameEnabled && <div className="ot-field-error mb-3">Game is currently disabled.</div>}
            {gameSettings?.settings?.maintenanceMode && <div className="ot-field-error mb-3">Game is under maintenance.</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              {/* Difficulty */}
              <div>
                <p className="ot-field-label">Difficulty Level</p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {Object.entries(difficultyLevels).map(([key, level]) => (
                    <button key={key} onClick={() => setSelectedDifficulty(key)} style={{ padding: '10px 14px', borderRadius: 6, border: `2px solid ${selectedDifficulty === key ? difficultyColor(key) : 'var(--ot-line)'}`, background: selectedDifficulty === key ? 'var(--ot-tint)' : 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div><strong>{level.name}</strong><div style={{ fontSize: 11, color: 'var(--ot-muted)' }}>{level.description}</div></div>
                        <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 600 }}>{level.oddsRange[0]}x – {level.oddsRange[1]}x</div><div style={{ fontSize: 11, color: 'var(--ot-muted)' }}>{level.probability}%</div></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet config */}
              <div>
                <p className="ot-field-label">Betting Setup</p>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Number of Dice{selectedDifficulty === 'legendary' && <span style={{ color: '#8b5cf6', marginLeft: 6 }}>(Min 3)</span>}</label>
                  <select value={selectedDiceCount} onChange={(e) => setSelectedDiceCount(parseInt(e.target.value))} className="ot-field" style={{ width: '100%' }}>
                    <option value={2} disabled={selectedDifficulty === 'legendary'}>2 Dice</option>
                    <option value={3}>3 Dice</option><option value={4}>4 Dice</option><option value={5}>5 Dice</option><option value={6}>6 Dice</option>
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Bet Amount (₦)</label>
                  <input type="number" value={betAmount} onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))} className="ot-field" style={{ width: '100%' }} min={gameSettings?.settings?.minBetAmount || 10} max={gameSettings?.settings?.maxBetAmount || 1000} />
                  <div style={{ fontSize: 11, color: 'var(--ot-muted)', marginTop: 4 }}>Min: ₦{gameSettings?.settings?.minBetAmount || 10} · Max: ₦{gameSettings?.settings?.maxBetAmount || 1000}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--ot-tint)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--ot-muted)' }}>Expected Value:</span><span style={{ fontWeight: 600, color: (difficultyLevels[selectedDifficulty].probability / 100 * currentOdds * betAmount - (1 - difficultyLevels[selectedDifficulty].probability / 100) * betAmount) >= 0 ? '#27805d' : '#b84545' }}>₦{(difficultyLevels[selectedDifficulty].probability / 100 * currentOdds * betAmount - (1 - difficultyLevels[selectedDifficulty].probability / 100) * betAmount).toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            {/* Target */}
            <div style={{ padding: 14, background: 'var(--ot-tint)', borderRadius: 6, marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 13 }}><strong>Target:</strong> {difficultyLevels[selectedDifficulty].target}</div>
              <div style={{ fontSize: 12, color: 'var(--ot-muted)', marginTop: 2 }}>Win Chance: {difficultyLevels[selectedDifficulty].probability}%</div>
            </div>

            {/* Dice */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              {Array.from({ length: selectedDiceCount }, (_, i) => (
                <div key={i} style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--ot-tint)', border: '1px solid var(--ot-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, animation: isRolling ? 'bounce 0.1s infinite' : 'none' }}>{getDiceIcon(dice[i])}</div>
              ))}
            </div>

            {/* Play button */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <button onClick={handlePlayGame} disabled={isRolling || playGameMutation.isPending || !gameSettings?.settings?.gameEnabled || gameSettings?.settings?.maintenanceMode} className="ot-button ot-button-primary" style={{ fontSize: 15, padding: '12px 32px' }}>
                {isRolling ? 'Rolling…' : playGameMutation.isPending ? 'Processing…' : `Bet ₦${betAmount} (${currentOdds}x)`}
              </button>
            </div>

            {/* Result */}
            {showResult && gameResult && (
              <div className="ot-panel" style={{ padding: 20, borderLeft: `4px solid ${gameResult.game.isWin ? '#27805d' : '#b84545'}` }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{gameResult.game.isWin ? 'Congratulations!' : 'Better Luck Next Time!'}</div>
                <div style={{ fontSize: 13, marginBottom: 8 }}>You rolled: <strong>{gameResult.game.dice.join(", ")}</strong></div>
                {gameResult.game.isWin ? (
                  <div style={{ fontSize: 13 }}><span style={{ color: '#27805d', fontWeight: 600 }}>Won ₦{(gameResult.game.winnings || 0).toLocaleString()}</span><span style={{ color: 'var(--ot-muted)', marginLeft: 8 }}>New balance: ₦{(gameResult.newBalance || 0).toLocaleString()}</span></div>
                ) : (
                  <div style={{ fontSize: 13 }}><span style={{ color: '#b84545', fontWeight: 600 }}>Lost ₦{betAmount + (gameSettings?.settings?.entryFee || 0)}</span><span style={{ color: 'var(--ot-muted)', marginLeft: 8 }}>New balance: ₦{(gameResult.newBalance || 0).toLocaleString()}</span></div>
                )}
              </div>
            )}

            {/* Rules */}
            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--ot-muted)', lineHeight: 1.8 }}>
              <strong>How to Play:</strong> Choose difficulty → Set bet amount → Review odds → Click Play → Win by achieving the target combination. Payout = Bet × Odds.
            </div>
          </div>
        </section>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <section className="ot-panel" aria-label="Betting history">
          <div className="ot-panel-heading"><div><h2>Betting History</h2><p>Your recent games.</p></div></div>
          {gameHistory?.games?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ot-line)' }}>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>Dice</th>
                    <th style={{ padding: '10px 24px', textAlign: 'right', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>Bet</th>
                    <th style={{ padding: '10px 24px', textAlign: 'right', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>Odds</th>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>Difficulty</th>
                    <th style={{ padding: '10px 24px', textAlign: 'right', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>Result</th>
                    <th style={{ padding: '10px 24px', textAlign: 'right', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.games.map((g) => (
                    <tr key={g._id} style={{ borderBottom: '1px solid var(--ot-line)' }}>
                      <td style={{ padding: '12px 24px' }}>{g.dice.map((d, i) => <span key={i} style={{ marginRight: 4 }}>{getDiceIcon(d)}</span>)} <span style={{ fontSize: 12, color: 'var(--ot-muted)', marginLeft: 4 }}>{g.dice.join(', ')}</span></td>
                      <td style={{ padding: '12px 24px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>₦{g.betAmount}</td>
                      <td style={{ padding: '12px 24px', textAlign: 'right' }}>{g.odds}x</td>
                      <td style={{ padding: '12px 24px', textTransform: 'capitalize' }}>{g.difficulty}</td>
                      <td style={{ padding: '12px 24px', textAlign: 'right' }}><span style={{ fontSize: 12, fontWeight: 600, color: g.gameResult === 'win' ? '#27805d' : '#b84545' }}>{g.gameResult === 'win' ? `+₦${g.winnings || 0}` : `-₦${g.betAmount || 0}`}</span></td>
                      <td style={{ padding: '12px 24px', textAlign: 'right', color: 'var(--ot-muted)', fontSize: 12 }}>{new Date(g.playedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ot-empty"><p>No games played yet.</p></div>
          )}
        </section>
      )}

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <section className="ot-panel" aria-label="Betting statistics">
          <div className="ot-panel-heading"><div><h2>Betting Statistics</h2><p>Your performance overview.</p></div></div>
          {enhancedStats ? (
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[{ label: 'Total Bets', value: enhancedStats.totalGames || 0, color: 'var(--ot-accent)' }, { label: 'Wins', value: enhancedStats.totalWins || 0, color: '#27805d' }, { label: 'Win Rate', value: `${(enhancedStats.winRate || 0).toFixed(1)}%`, color: '#d97706' }, { label: 'Net Profit', value: `₦${(enhancedStats.netProfit || 0).toLocaleString()}`, color: (enhancedStats.netProfit || 0) >= 0 ? '#27805d' : '#b84545' }].map(s => (
                  <div key={s.label} style={{ padding: '14px 16px', background: 'var(--ot-tint)', borderRadius: 6 }}><div style={{ fontSize: 11, color: 'var(--ot-muted)', marginBottom: 4 }}>{s.label}</div><div style={{ fontSize: 20, fontWeight: 600, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div></div>
                ))}
              </div>

              <p className="ot-field-label">Performance by Difficulty</p>
              <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
                {Object.entries(difficultyLevels).map(([key, level]) => {
                  const ds = enhancedStats.difficultyStats?.[key] || { games: 0, wins: 0, winRate: 0, totalBet: 0, totalWon: 0, netProfit: 0 };
                  return (
                    <div key={key} style={{ padding: '12px 16px', background: 'var(--ot-tint)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                      <div><strong style={{ color: difficultyColor(key) }}>{level.name}</strong><div style={{ fontSize: 11, color: 'var(--ot-muted)' }}>{level.description}</div></div>
                      <div style={{ textAlign: 'right', fontSize: 12 }}>
                        <div>{ds.games} games · {ds.winRate.toFixed(1)}% win</div>
                        <div style={{ color: ds.netProfit >= 0 ? '#27805d' : '#b84545', fontWeight: 500 }}>₦{ds.netProfit.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="ot-field-label">Insights</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ label: 'Most Profitable', value: enhancedStats.mostProfitableDifficulty || '—' }, { label: 'Avg Bet Size', value: `₦${(enhancedStats.averageBetSize || 0).toLocaleString()}` }, { label: 'Largest Win', value: `₦${(enhancedStats.largestWin || 0).toLocaleString()}` }, { label: 'Best Streak', value: `${enhancedStats.bestWinStreak || 0} games` }, { label: 'Total Wagered', value: `₦${(enhancedStats.totalWagered || 0).toLocaleString()}` }].map(s => (
                  <div key={s.label} style={{ padding: '10px 14px', background: 'var(--ot-tint)', borderRadius: 6 }}><div style={{ fontSize: 11, color: 'var(--ot-muted)' }}>{s.label}</div><div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{s.value}</div></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="ot-empty"><p>No statistics available yet. Play some games!</p></div>
          )}
        </section>
      )}
    </div>
  );
};

export default BetDiceGame;
