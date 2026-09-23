import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getReferrals as getReferralsApi } from "../../api";
import { FaShareAlt } from "react-icons/fa";

const primaryBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark disabled:opacity-45";
const secondaryBtn =
  "inline-flex min-h-[38px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink transition hover:bg-tint disabled:opacity-45 disabled:cursor-not-allowed";
const panel =
  "overflow-hidden rounded-lg border border-line bg-paper";
const panelHeading =
  "flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]";
const panelBody = "px-6 pb-6";
const th = "px-6 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.5px] text-muted";
const td = "px-6 py-3";

const Referral = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const user = useSelector((state: any) => state.user?.user);

  const { data: referrals, isLoading, isError, error } = useQuery({
    queryKey: ["referrals", { page: currentPage, limit, search: debouncedSearchTerm }],
    queryFn: () => getReferralsApi(currentPage, limit, debouncedSearchTerm),
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on OhTopUp!",
          text: `Use my referral code: ${user?.referralCode}`,
          url: `https://ohtopup.name.ng/create?code=${user?.referralCode}`,
        });
        toast.success("Referral link shared successfully!");
      } catch {
        toast.error("Failed to share the referral link.");
      }
    } else {
      navigator.clipboard.writeText(user?.referralCode);
      toast.success("Referral code copied to clipboard!");
    }
  };

  const totalPages = referrals?.totalPages ?? 1;
  const refList = referrals?.users ?? [];

  return (
    <div className="min-w-0">
      <div className="mb-[30px] flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">
            Referral Program
          </h1>
          <p className="text-[13px] text-muted">
            Invite friends and earn rewards when they join and make their first deposit
          </p>
        </div>
      </div>

      <div className="mb-8 grid min-w-0 grid-cols-1 gap-6 md:mb-8 nav:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
        <section className={panel}>
          <div className={panelHeading}>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Your Referral Code</h2>
              <p className="mt-1 text-xs text-muted">Share this code with friends to earn rewards.</p>
            </div>
          </div>
          <div className={panelBody}>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="min-w-[160px] flex-1 rounded-md border border-line bg-tint px-4 py-3 text-center font-mono text-base font-semibold tracking-[1px]">
                {user?.referralCode}
              </div>
              <button onClick={handleShare} className={`${primaryBtn} whitespace-nowrap`}>
                <FaShareAlt /> Share Code
              </button>
            </div>

            <p className="mb-3 block text-xs font-mediumish text-ink">How it works</p>
            <div className="flex min-w-0 gap-6 border-line pb-[23px] pt-[23px] [&+&]:border-t [&+&]:border-t-line first:border-t-0 first:pt-0">
              {[
                ["01", "Share your code", "Send your unique referral code to friends."],
                ["02", "They sign up", "Friends register using your referral code."],
                ["03", "First deposit", "They make their first ₦1,000+ deposit."],
                ["04", "You earn ₦500", "Points are credited to your account instantly."],
              ].map(([n, title, body]) => (
                <div key={n} className="flex min-w-0 gap-6 border-t border-line py-[23px] first:border-t-0 first:pt-0">
                  <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted">{n}</span>
                  <div>
                    <h3 className="mb-[7px] text-base font-semibold">{title}</h3>
                    <p className="text-[13px] leading-[1.8] text-muted">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={panel}>
          <div className={panelHeading}>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Your Stats</h2>
              <p className="mt-1 text-xs text-muted">Referral performance at a glance.</p>
            </div>
          </div>
          <div className={`${panelBody} grid gap-3`}>
            {[
              { label: "Total Referrals", value: referrals?.totalUsers || 0 },
              { label: "Points Earned", value: user?.points || 0, color: "#27805d" },
              {
                label: "Potential Earnings",
                value: `₦${((referrals?.totalUsers || 0) * 500).toLocaleString()}`,
                color: "var(--ot-accent)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-md bg-tint px-4 py-3.5"
              >
                <span className="text-[13px] text-muted">{s.label}</span>
                <span
                  className="text-xl font-semibold tabular-nums"
                  style={{ color: s.color || "var(--ot-ink)" }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={panel} aria-label="Referrals list">
        <div className={panelHeading}>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Your Referrals</h2>
            <p className="mt-1 text-xs text-muted">People who joined using your code.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 px-6 pb-4">
          <input
            type="search"
            placeholder="Search by username or email…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 min-w-[200px] max-w-[320px] flex-1 rounded-md border border-line bg-bg px-3 text-xs text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setDebouncedSearchTerm("");
              }}
              className={`${secondaryBtn} !min-h-auto !px-3 !py-1.5 !text-xs`}
            >
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center" role="status">
            <p className="text-xs text-muted">Loading referrals…</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <h3 className="mb-1.5 text-[15px] font-mediumish">We couldn&apos;t load your referrals.</h3>
            <p className="mb-4 text-xs text-muted">{(error as any)?.message || "Please try again."}</p>
            <button className={secondaryBtn} onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : refList.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="mb-1.5 text-[15px] font-mediumish">No referrals yet.</h3>
            <p className="mb-4 text-xs text-muted">Share your code and earn ₦500 for every friend who joins.</p>
            <button onClick={handleShare} className={primaryBtn}>
              <FaShareAlt /> Share Your Code
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>Username</th>
                    <th className={th}>Email</th>
                    <th className={th}>Joined</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {refList.map((u: any) => (
                    <tr key={u._id} className="border-b border-line last:border-b-0">
                      <td className={`${td} font-medium`}>{u.username}</td>
                      <td className={`${td} text-muted`}>{u.email}</td>
                      <td className={`${td} text-muted`}>
                        {new Date(u.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className={td}>
                        <span
                          className="text-xs font-medium"
                          style={{ color: u.points > 0 ? "#27805d" : "#9a6818" }}
                        >
                          {u.points > 0 ? "Rewarded" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 px-6 py-4">
                <button className={secondaryBtn} disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  ← Prev
                </button>
                <span className="text-xs text-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className={secondaryBtn}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Referral;
