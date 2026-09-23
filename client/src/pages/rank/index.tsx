import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRanking, getUser, getUserAchievements, getUserRewards, redeemUserReward, getAllRewards } from "../../api";
import { FaGift } from "react-icons/fa";

const primaryBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark disabled:opacity-45";
const panel = "overflow-hidden rounded-lg border border-line bg-paper";
const panelHeading = "flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]";
const panelBody = "px-6 pb-6";
const th = "px-6 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.5px] text-muted";
const td = "px-6 py-3";
const fieldLabel = "mb-2 block text-xs font-mediumish text-ink";
const empty = "p-12 text-center";

const Rank = () => {
  const [activeTab, setActiveTab] = useState("Leaderboard");

  const { data: rankingData, error: rankingError, isLoading: rankingLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: () => getRanking("weekly"),
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

  const userStats = rankingData?.rankings?.find(
    (u: any) => u.username === userData?.username?.replace(/.(?=.{3})/g, "*")
  );
  const userPosition = rankingData?.rankings?.findIndex((r: any) => r.username === userData?.username) ?? -1;

  const formatCountdown = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const getIncentives = (rank: number) => {
    if (rank === 1) return { discount: 15, bonus: 500, label: "Champion" };
    if (rank === 2) return { discount: 12, bonus: 300, label: "Runner-up" };
    if (rank === 3) return { discount: 10, bonus: 200, label: "Third Place" };
    if (rank <= 10) return { discount: 5, bonus: 0, label: "Top 10" };
    return { discount: 0, bonus: 0, label: "Participant" };
  };

  const statusColor = (s: string) => {
    if (s === "assigned") return "#27805d";
    if (s === "redeemed") return "var(--ot-accent)";
    return "var(--ot-muted)";
  };

  return (
    <div className="min-w-0">
      <div className="mb-[30px] flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">
            Champions League
          </h1>
          <p className="text-[13px] text-muted">Compete with utility purchases, earn rewards, and climb the leaderboard</p>
        </div>
      </div>

      <nav className="mb-5 flex flex-wrap gap-6 border-b border-line" aria-label="Rank sections">
        {["Leaderboard", "Rewards", "Achievements"].map((tab) => (
          <button
            key={tab}
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "-mb-px min-h-11 border-b-2 pb-3 text-xs font-mediumish transition-colors",
              activeTab === tab ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
            ].join(" ")}
          >
            {tab === "Leaderboard" ? "Rankings" : tab}
          </button>
        ))}
      </nav>

      {userStats && (
        <div className="mb-8 grid min-w-0 grid-cols-1 gap-6 nav:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
          <section className={panel}>
            <div className={panelHeading}>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Your Performance</h2>
                <p className="mt-1 text-xs text-muted">Your current standing and achievements.</p>
              </div>
            </div>
            <div className={`${panelBody} grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3`}>
              {[
                { label: "Rank", value: `#${userPosition + 1}`, color: "var(--ot-accent)" },
                { label: "Transactions", value: userStats.transactionCount, color: "#27805d" },
                { label: "Points", value: userStats.points || 0, color: "#9a6818" },
                {
                  label: "Reward",
                  value: `${getIncentives(userPosition + 1).discount}% OFF`,
                  color: "#8b5cf6",
                },
              ].map((s) => (
                <div key={s.label} className="rounded-md bg-tint px-4 py-3.5">
                  <div className="mb-1 text-[11px] text-muted">{s.label}</div>
                  <div className="text-xl font-semibold tabular-nums" style={{ color: s.color }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {achievementsData?.recentAchievements?.length > 0 && (
            <section className={panel}>
              <div className={panelHeading}>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Recent Achievements</h2>
                </div>
              </div>
              <div className={`${panelBody} flex gap-2.5 overflow-x-auto`}>
                {achievementsData.recentAchievements.map((a: any, i: number) => (
                  <div key={i} className="shrink-0 rounded-md bg-tint px-3.5 py-2.5 text-xs">
                    <div className="font-semibold capitalize">{a.type.replace("_", " ")}</div>
                    <div className="mt-0.5 text-muted">+{a.points} pts</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "Leaderboard" && (
        <section className={panel} aria-label="Leaderboard">
          <div className={panelHeading}>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Full Rankings</h2>
              <p className="mt-1 text-xs text-muted">Weekly leaderboard standings.</p>
            </div>
          </div>
          {rankingLoading ? (
            <div className={empty} role="status">
              <p className="text-xs text-muted">Loading leaderboard…</p>
            </div>
          ) : rankingError ? (
            <div className={empty}>
              <h3 className="mb-1.5 text-[15px] font-mediumish">We couldn&apos;t load rankings.</h3>
              <p className="text-xs text-muted">{(rankingError as any).message || 'Please try again.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>Rank</th>
                    <th className={th}>User</th>
                    <th className={`${th} text-right`}>Transactions</th>
                    <th className={`${th} text-right`}>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingData?.rankings?.map((u: any, index: number) => {
                    const rank = index + 1;
                    const incentives = getIncentives(rank);
                    const isCurrentUser = userData?.username === u.username;
                    return (
                      <tr
                        key={index}
                        className="border-b border-line last:border-b-0"
                        style={{ background: isCurrentUser ? "var(--ot-tint)" : undefined }}
                      >
                        <td className={`${td} font-semibold tabular-nums`}>
                          {rank <= 3 ? (
                            <span style={{ color: rank === 1 ? "#d4a017" : rank === 2 ? "#9ca3af" : "#cd7f32" }}>
                              {rank === 1 ? "🏆" : rank === 2 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            `#${rank}`
                          )}
                        </td>
                        <td className={`${td} ${isCurrentUser ? "font-semibold" : ""}`}>
                          {u.username}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-[11px] text-accent">(You)</span>
                          )}
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{u.transactionCount}</td>
                        <td className={`${td} text-right`}>
                          {incentives.discount > 0 && (
                            <span className="text-[11px] font-semibold" style={{ color: "#27805d" }}>
                              {incentives.discount}% OFF
                            </span>
                          )}
                          {incentives.bonus > 0 && (
                            <span className="ml-2 text-[11px] font-semibold text-purple-500">
                              ₦{incentives.bonus}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {rankingData?.countdown && (
            <div className="border-t border-line px-6 py-3.5 text-center text-[13px]">
              <span className="text-muted">Next reset in: </span>
              <span className="font-semibold tabular-nums">{formatCountdown(rankingData.countdown)}</span>
              <span className="ml-1.5 text-muted">(every Sunday at midnight)</span>
            </div>
          )}
        </section>
      )}

      {activeTab === "Rewards" && (
        <section className={panel} aria-label="Rewards">
          <div className={panelHeading}>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-[-0.2px]">My Rewards</h2>
              <p className="mt-1 text-xs text-muted">Assigned and available rewards.</p>
            </div>
          </div>
          <div className={panelBody}>
            <p className={fieldLabel}>Assigned Rewards</p>
            {userRewardsData?.userRewards?.length > 0 ? (
              <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                {userRewardsData.userRewards.map((ur: any) => (
                  <div key={ur._id} className="rounded-lg border border-line bg-paper p-4">
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold">
                        <FaGift className="mr-1.5 inline text-accent" />
                        {ur.rewardSnapshot?.name || "Reward"}
                      </span>
                      <span className="text-[11px] font-medium capitalize" style={{ color: statusColor(ur.status) }}>
                        {ur.status}
                      </span>
                    </div>
                    <div className="text-xs leading-relaxed text-muted">
                      <div>
                        Type:{" "}
                        <strong className="capitalize" style={{ color: "var(--ot-ink)" }}>
                          {ur.rewardSnapshot?.type || "N/A"}
                        </strong>
                      </div>
                      <div>
                        Value:{" "}
                        <strong style={{ color: "var(--ot-ink)" }}>
                          {ur.rewardSnapshot?.type === "discount"
                            ? `${ur.rewardSnapshot?.value}%`
                            : `₦${ur.rewardSnapshot?.value || 0}`}
                        </strong>
                      </div>
                      <div>Assigned: {new Date(ur.assignedAt).toLocaleDateString()}</div>
                    </div>
                    {ur.status === "assigned" && (
                      <button
                        onClick={async () => {
                          if (window.confirm('Redeem this reward?')) {
                            try {
                              await redeemUserReward(ur._id);
                              refetchUserRewards();
                            } catch {
                              // keep UI stable if redeem fails; toast is handled elsewhere
                            }
                          }
                        }}
                        className={`${primaryBtn} mt-3 w-full !min-h-auto !px-4 !py-2 !text-xs`}
                      >
                        Redeem
                      </button>
                    )}
                    {ur.status === "redeemed" && (
                      <div className="mt-2.5 text-center text-xs" style={{ color: "#27805d" }}>
                        Redeemed on {new Date(ur.redeemedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={empty}>
                <p className="text-xs text-muted">No rewards assigned yet. Keep using the platform!</p>
              </div>
            )}

            <p className={fieldLabel}>Available Rewards</p>
            {allRewardsData?.rewards?.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                {allRewardsData.rewards
                  .filter((r: any) => r.isActive)
                  .map((r: any) => (
                    <div key={r._id} className="rounded-lg border border-line bg-paper p-4">
                      <div className="mb-2 text-[13px] font-semibold">{r.name}</div>
                      <div className="text-xs leading-relaxed text-muted">
                        <div>
                          Type:{" "}
                          <strong className="capitalize" style={{ color: "var(--ot-ink)" }}>
                            {r.type}
                          </strong>
                        </div>
                        <div>
                          Value:{" "}
                          <strong style={{ color: "var(--ot-ink)" }}>
                            {r.type === "discount" ? `${r.value}%` : `₦${r.value}`}
                          </strong>
                        </div>
                        <div>
                          Rank Required: <strong style={{ color: "var(--ot-ink)" }}>#{r.rank}</strong>
                        </div>
                      </div>
                      {userStats && userStats.rank >= r.rank && (
                        <div className="mt-2.5 text-[11px] font-medium" style={{ color: "#27805d" }}>
                          You qualify for this reward!
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className={empty}>
                <p className="text-xs text-muted">No rewards available yet.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "Achievements" && (
        <section className={panel} aria-label="Achievements">
          <div className={panelHeading}>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Achievement Badges</h2>
              <p className="mt-1 text-xs text-muted">Unlock milestones by using the platform.</p>
            </div>
          </div>
          <div className={`${panelBody} grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3`}>
            {[
              { name: "Power User", desc: "Complete 50+ transactions", color: "#ef4444" },
              { name: "Active Member", desc: "Complete 25+ transactions", color: "#3b82f6" },
              { name: "Elite Member", desc: "Top 3 on leaderboard", color: "#8b5cf6" },
            ].map((b) => (
              <div key={b.name} className="rounded-lg border border-line bg-paper p-4 text-center">
                <div
                  className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ background: b.color }}
                >
                  {b.name[0]}
                </div>
                <div className="mb-1 text-[13px] font-semibold">{b.name}</div>
                <div className="text-xs text-muted">{b.desc}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Rank;
