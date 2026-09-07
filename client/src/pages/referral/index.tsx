import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getReferrals as getReferralsApi } from "../../api";
import { FaShareAlt } from "react-icons/fa";

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
        await navigator.share({ title: "Join me on OhTopUp!", text: `Use my referral code: ${user?.referralCode}`, url: `https://ohtopup.name.ng/create?code=${user?.referralCode}` });
        toast.success("Referral link shared successfully!");
      } catch { toast.error("Failed to share the referral link."); }
    } else {
      navigator.clipboard.writeText(user?.referralCode);
      toast.success("Referral code copied to clipboard!");
    }
  };

  const totalPages = referrals?.totalPages ?? 1;
  const refList = referrals?.users ?? [];

  return (
    <div className="ot-dashboard">
      <div className="ot-dashboard-heading"><div><h1>Referral Program</h1><p>Invite friends and earn rewards when they join and make their first deposit</p></div></div>

      <div className="ot-overview">
        {/* Referral code card */}
        <section className="ot-panel">
          <div className="ot-panel-heading"><div><h2>Your Referral Code</h2><p>Share this code with friends to earn rewards.</p></div></div>
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, padding: '12px 16px', background: 'var(--ot-tint)', border: '1px solid var(--ot-line)', borderRadius: 6, fontFamily: 'monospace', fontSize: 16, fontWeight: 600, textAlign: 'center', letterSpacing: '1px' }}>
                {user?.referralCode}
              </div>
              <button onClick={handleShare} className="ot-button ot-button-primary" style={{ whiteSpace: 'nowrap' }}><FaShareAlt /> Share Code</button>
            </div>

            <p className="ot-field-label" style={{ marginBottom: 12 }}>How it works</p>
            <div className="ot-feature-row" style={{ borderTop: 'none', paddingTop: 0 }}><span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--ot-muted)', paddingTop: 4 }}>01</span><div><h3>Share your code</h3><p>Send your unique referral code to friends.</p></div></div>
            <div className="ot-feature-row"><span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--ot-muted)', paddingTop: 4 }}>02</span><div><h3>They sign up</h3><p>Friends register using your referral code.</p></div></div>
            <div className="ot-feature-row"><span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--ot-muted)', paddingTop: 4 }}>03</span><div><h3>First deposit</h3><p>They make their first ₦1,000+ deposit.</p></div></div>
            <div className="ot-feature-row"><span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--ot-muted)', paddingTop: 4 }}>04</span><div><h3>You earn ₦500</h3><p>Points are credited to your account instantly.</p></div></div>
          </div>
        </section>

        {/* Stats */}
        <section className="ot-panel">
          <div className="ot-panel-heading"><div><h2>Your Stats</h2><p>Referral performance at a glance.</p></div></div>
          <div style={{ padding: '0 24px 24px', display: 'grid', gap: 12 }}>
            {[{ label: 'Total Referrals', value: referrals?.totalUsers || 0 }, { label: 'Points Earned', value: user?.points || 0, color: '#27805d' }, { label: 'Potential Earnings', value: `₦${((referrals?.totalUsers || 0) * 500).toLocaleString()}`, color: 'var(--ot-accent)' }].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--ot-tint)', borderRadius: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--ot-muted)' }}>{s.label}</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: s.color || 'var(--ot-ink)', fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Referrals list */}
      <section className="ot-panel" aria-label="Referrals list">
        <div className="ot-panel-heading"><div><h2>Your Referrals</h2><p>People who joined using your code.</p></div></div>
        <div style={{ padding: '0 24px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="search" placeholder="Search by username or email…" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="ot-field" style={{ flex: '1 1 200px', maxWidth: 320 }} />
          {searchTerm && <button onClick={() => { setSearchTerm(""); setDebouncedSearchTerm(""); }} className="ot-button ot-button-secondary" style={{ fontSize: 12, padding: '6px 12px', minHeight: 'auto' }}>Clear</button>}
        </div>

        {isLoading ? (
          <div className="ot-empty" role="status"><p>Loading referrals…</p></div>
        ) : isError ? (
          <div className="ot-empty"><h3>We couldn't load your referrals.</h3><p>{error?.message || 'Please try again.'}</p><button className="ot-button ot-button-secondary" onClick={() => window.location.reload()}>Try again</button></div>
        ) : refList.length === 0 ? (
          <div className="ot-empty"><h3>No referrals yet.</h3><p>Share your code and earn ₦500 for every friend who joins.</p><button onClick={handleShare} className="ot-button ot-button-primary"><FaShareAlt /> Share Your Code</button></div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ot-line)' }}>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</th>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</th>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {refList.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--ot-line)' }}>
                      <td style={{ padding: '12px 24px', fontWeight: 500 }}>{u.username}</td>
                      <td style={{ padding: '12px 24px', color: 'var(--ot-muted)' }}>{u.email}</td>
                      <td style={{ padding: '12px 24px', color: 'var(--ot-muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '12px 24px' }}><span style={{ fontSize: 12, color: u.points > 0 ? '#27805d' : '#9a6818', fontWeight: 500 }}>{u.points > 0 ? 'Rewarded' : 'Pending'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 24px' }}>
                <button className="ot-button ot-button-secondary" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>← Prev</button>
                <span style={{ fontSize: 12, color: 'var(--ot-muted)' }}>Page {currentPage} of {totalPages}</span>
                <button className="ot-button ot-button-secondary" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Referral;
