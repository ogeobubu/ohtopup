import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRanking, getUser, getUserAchievements, getUserRewards, redeemUserReward, getAllRewards } from "../../api";
import { FaGift } from "react-icons/fa";

const Rank = () => {
  const [activeTab, setActiveTab] = useState("Leaderboard");

  const { data: rankingData, error: rankingError, isLoading: rankingLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: () => getRanking('weekly'),
    staleTime: 30000,
  });

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 60000,
  });

  const { data: achievementsData } = useQuery({
    queryKey: ["achievements"],
    queryFn: getUserAchievements,
    staleTime: 30000,
  });

  const { data: userRewardsData, refetch: refetchUserRewards } = useQuery({
    queryKey: ["user-rewards"],
    queryFn: () => getUserRewards(),
    enabled: !!userData?.id,
    staleTime: 30000,
  });

  const { data: allRewardsData } = useQuery({
    queryKey: ["all-rewards"],
    queryFn: () => getAllRewards({ page: 1, limit: 50 }),
    staleTime: 30000,
  });

  const userStats = rankingData?.rankings?.find(user => user.username === userData?.username?.replace(/.(?=.{3})/g, "*"));
  const userPosition = rankingData?.rankings?.findIndex(r => r.username === userData?.username) ?? -1;

  const formatCountdown = (seconds) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const getIncentives = (rank) => {
    if (rank === 1) return { discount: 15, bonus: 500, label: 'Champion' };
    if (rank === 2) return { discount: 12, bonus: 300, label: 'Runner-up' };
    if (rank === 3) return { discount: 10, bonus: 200, label: 'Third Place' };
    if (rank <= 10) return { discount: 5, bonus: 0, label: 'Top 10' };
    return { discount: 0, bonus: 0, label: 'Participant' };
  };

  const statusColor = (s) => { if (s === 'assigned') return '#27805d'; if (s === 'redeemed') return 'var(--ot-accent)'; return 'var(--ot-muted)'; };

  return (
    <div className="ot-dashboard">
      <div className="ot-dashboard-heading"><div><h1>Champions League</h1><p>Compete with utility purchases, earn rewards, and climb the leaderboard</p></div></div>

      <nav className="ot-utility-tabs" aria-label="Rank sections">
        {["Leaderboard", "Rewards", "Achievements"].map((tab) => (
          <button key={tab} aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab === "Leaderboard" ? "Rankings" : tab}</button>
        ))}
      </nav>

      {/* User Stats */}
      {userStats && (
        <div className="ot-overview">
          <section className="ot-panel">
            <div className="ot-panel-heading"><div><h2>Your Performance</h2><p>Your current standing and achievements.</p></div></div>
            <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[{ label: 'Rank', value: `#${userPosition + 1}`, color: 'var(--ot-accent)' }, { label: 'Transactions', value: userStats.transactionCount, color: '#27805d' }, { label: 'Points', value: userStats.points || 0, color: '#9a6818' }, { label: 'Reward', value: `${getIncentives(userPosition + 1).discount}% OFF`, color: '#8b5cf6' }].map(s => (
                <div key={s.label} style={{ padding: '14px 16px', background: 'var(--ot-tint)', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ot-muted)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Achievements */}
          {achievementsData?.recentAchievements?.length > 0 && (
            <section className="ot-panel">
              <div className="ot-panel-heading"><div><h2>Recent Achievements</h2></div></div>
              <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10, overflowX: 'auto' }}>
                {achievementsData.recentAchievements.map((a, i) => (
                  <div key={i} style={{ flex: '0 0 auto', padding: '10px 14px', background: 'var(--ot-tint)', borderRadius: 6, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{a.type.replace('_', ' ')}</div>
                    <div style={{ color: 'var(--ot-muted)', marginTop: 2 }}>+{a.points} pts</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === "Leaderboard" && (
        <section className="ot-panel" aria-label="Leaderboard">
          <div className="ot-panel-heading"><div><h2>Full Rankings</h2><p>Weekly leaderboard standings.</p></div></div>
          {rankingLoading ? (
            <div className="ot-empty" role="status"><p>Loading leaderboard…</p></div>
          ) : rankingError ? (
            <div className="ot-empty"><h3>We couldn't load rankings.</h3><p>{rankingError.message}</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ot-line)' }}>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rank</th>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                    <th style={{ padding: '10px 24px', textAlign: 'right', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transactions</th>
                    <th style={{ padding: '10px 24px', textAlign: 'right', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingData?.rankings?.map((user, index) => {
                    const rank = index + 1;
                    const incentives = getIncentives(rank);
                    const isCurrentUser = userData?.username === user.username;
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid var(--ot-line)', background: isCurrentUser ? 'var(--ot-tint)' : undefined }}>
                        <td style={{ padding: '12px 24px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {rank <= 3 ? <span style={{ color: rank === 1 ? '#d4a017' : rank === 2 ? '#9ca3af' : '#cd7f32' }}>{rank === 1 ? '🏆' : rank === 2 ? '🥈' : '🥉'}</span> : `#${rank}`}
                        </td>
                        <td style={{ padding: '12px 24px', fontWeight: isCurrentUser ? 600 : 400 }}>{user.username}{isCurrentUser && <span style={{ fontSize: 11, color: 'var(--ot-accent)', marginLeft: 6 }}>(You)</span>}</td>
                        <td style={{ padding: '12px 24px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{user.transactionCount}</td>
                        <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                          {incentives.discount > 0 && <span style={{ fontSize: 11, color: '#27805d', fontWeight: 600 }}>{incentives.discount}% OFF</span>}
                          {incentives.bonus > 0 && <span style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 600, marginLeft: 8 }}>₦{incentives.bonus}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {rankingData?.countdown && (
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--ot-line)', textAlign: 'center', fontSize: 13 }}>
              <span style={{ color: 'var(--ot-muted)' }}>Next reset in: </span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCountdown(rankingData.countdown)}</span>
              <span style={{ color: 'var(--ot-muted)', marginLeft: 6 }}>(every Sunday at midnight)</span>
            </div>
          )}
        </section>
      )}

      {/* Rewards */}
      {activeTab === "Rewards" && (
        <section className="ot-panel" aria-label="Rewards">
          <div className="ot-panel-heading"><div><h2>My Rewards</h2><p>Assigned and available rewards.</p></div></div>
          <div style={{ padding: '0 24px 24px' }}>
            <p className="ot-field-label">Assigned Rewards</p>
            {userRewardsData?.userRewards?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 32 }}>
                {userRewardsData.userRewards.map((ur) => (
                  <div key={ur._id} className="ot-panel" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}><FaGift style={{ marginRight: 6, color: 'var(--ot-accent)' }} />{ur.rewardSnapshot?.name || 'Reward'}</span>
                      <span style={{ fontSize: 11, color: statusColor(ur.status), fontWeight: 500 }}>{ur.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ot-muted)', lineHeight: 1.8 }}>
                      <div>Type: <strong style={{ color: 'var(--ot-ink)', textTransform: 'capitalize' }}>{ur.rewardSnapshot?.type || 'N/A'}</strong></div>
                      <div>Value: <strong style={{ color: 'var(--ot-ink)' }}>{ur.rewardSnapshot?.type === 'discount' ? `${ur.rewardSnapshot?.value}%` : `₦${ur.rewardSnapshot?.value || 0}`}</strong></div>
                      <div>Assigned: {new Date(ur.assignedAt).toLocaleDateString()}</div>
                    </div>
                    {ur.status === 'assigned' && (
                      <button onClick={async () => { if (window.confirm('Redeem this reward?')) { try { await redeemUserReward(ur._id); refetchUserRewards(); } catch { } } }} className="ot-button ot-button-primary" style={{ width: '100%', marginTop: 12, fontSize: 12, padding: '8px 16px', minHeight: 'auto' }}>Redeem</button>
                    )}
                    {ur.status === 'redeemed' && <div style={{ fontSize: 12, color: '#27805d', marginTop: 10, textAlign: 'center' }}>Redeemed on {new Date(ur.redeemedAt).toLocaleDateString()}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ot-empty"><p>No rewards assigned yet. Keep using the platform!</p></div>
            )}

            <p className="ot-field-label">Available Rewards</p>
            {allRewardsData?.rewards?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {allRewardsData.rewards.filter(r => r.isActive).map((r) => (
                  <div key={r._id} className="ot-panel" style={{ padding: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ot-muted)', lineHeight: 1.8 }}>
                      <div>Type: <strong style={{ color: 'var(--ot-ink)', textTransform: 'capitalize' }}>{r.type}</strong></div>
                      <div>Value: <strong style={{ color: 'var(--ot-ink)' }}>{r.type === 'discount' ? `${r.value}%` : `₦${r.value}`}</strong></div>
                      <div>Rank Required: <strong style={{ color: 'var(--ot-ink)' }}>#{r.rank}</strong></div>
                    </div>
                    {userStats && userStats.rank >= r.rank && <div style={{ fontSize: 11, color: '#27805d', marginTop: 10, fontWeight: 500 }}>You qualify for this reward!</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ot-empty"><p>No rewards available yet.</p></div>
            )}
          </div>
        </section>
      )}

      {/* Achievements */}
      {activeTab === "Achievements" && (
        <section className="ot-panel" aria-label="Achievements">
          <div className="ot-panel-heading"><div><h2>Achievement Badges</h2><p>Unlock milestones by using the platform.</p></div></div>
          <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[{ name: 'Power User', desc: 'Complete 50+ transactions', color: '#ef4444' }, { name: 'Active Member', desc: 'Complete 25+ transactions', color: '#3b82f6' }, { name: 'Elite Member', desc: 'Top 3 on leaderboard', color: '#8b5cf6' }].map((b) => (
              <div key={b.name} className="ot-panel" style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: b.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 18, fontWeight: 700 }}>{b.name[0]}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ot-muted)' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Rank;
