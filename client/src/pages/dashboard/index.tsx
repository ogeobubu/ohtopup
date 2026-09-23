import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiPlus, FiArrowRight, FiArrowDownLeft, FiArrowUpRight, FiClock, FiHelpCircle, FiEye, FiEyeOff, FiBell } from 'react-icons/fi';
import { getUser, getWallet, getTransactions } from '../../api';
import { setUser } from '../../actions/userActions';
import { formatNairaAmount } from '../../utils';
import Shortcut from './shortcut';
import usePushNotifications from '../../hooks/usePushNotifications';

function statusStyle(status: string) {
  if (['completed', 'successful', 'delivered'].includes(status)) return ['success', 'Completed'];
  if (['failed', 'rejected'].includes(status)) return ['failed', status === 'rejected' ? 'Rejected' : 'Failed'];
  return ['pending', status === 'review_needed' ? 'Under review' : status === 'approved' ? 'Approved' : 'Pending'];
}

const statusTone: Record<string, string> = {
  success: 'text-success dark:text-success-dark',
  pending: 'text-warning dark:text-warning-dark',
  failed: 'text-danger dark:text-danger-dark',
};

const lightBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-white px-[15px] py-[11px] text-[13px] font-semibold text-[#18232d] transition hover:bg-[#e9edfa] nav:text-sm nav:gap-4 nav:px-[19px]';
const primaryBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark nav:text-sm nav:gap-4 nav:px-[19px]';
const secondaryBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-[15px] py-[11px] text-[13px] font-semibold text-ink transition hover:bg-tint nav:text-sm';
const textLink = 'inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-accent hover:underline hover:underline-offset-4 nav:text-sm';

export default function Dashboard() {
  const dispatch = useDispatch();
  const [hidden, setHidden] = useState(false);
  const user = useQuery({ queryKey: ['user'], queryFn: getUser });
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: getWallet });
  const activity = useQuery({ queryKey: ['recent-transactions'], queryFn: () => getTransactions('', 1, 5) });
  const { supported, isSubscribed, subscribe, loading } = usePushNotifications();
  useEffect(() => { if (user.data) dispatch(setUser(user.data)); }, [user.data, dispatch]);
  const transactions = activity.data?.transactions || [];
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('push_banner_dismissed') === '1');
  const hideBanner = isSubscribed || dismissed;
  return (
    <div className="min-w-0">
      <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-5 md:mb-[30px]">
        <div className="min-w-0">
          <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">Your overview</h1>
          <p className="text-[13px] text-muted">{user.data?.username ? `Welcome back, ${user.data.username}.` : 'Your payments, all in one place.'}</p>
        </div>
        <span className="hidden text-[11px] text-muted md:inline">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>

      {!hideBanner && supported && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper p-4 text-[13px] leading-relaxed md:mb-5">
          <span className="flex min-w-0 flex-[1_1_260px] items-center gap-2.5"><FiBell className="shrink-0 text-accent" /> Enable push notifications to get real-time updates.</span>
          <div className="flex shrink-0 gap-2">
            <button onClick={subscribe} disabled={loading} className={primaryBtn}>{loading ? 'Enabling…' : 'Enable'}</button>
            <button onClick={() => { localStorage.setItem('push_banner_dismissed','1'); setDismissed(true); }} className={secondaryBtn}>Later</button>
          </div>
        </div>
      )}
      {user.isError && <p role="alert" className="mb-4 text-[11px] text-danger">We couldn’t load your profile. <button className="underline" onClick={() => user.refetch()}>Try again</button></p>}

      <div className="mb-6 grid min-w-0 grid-cols-1 gap-5 md:mb-8 md:gap-6 nav:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
        <section className="flex min-w-0 flex-col items-start rounded-lg bg-night p-5 text-white md:p-7" aria-label="Wallet balance">
          <div className="flex items-center gap-2.5 text-xs text-[#c2ceda]">
            Available balance
            <button className="min-h-11 min-w-11 p-1" onClick={() => setHidden(!hidden)} aria-label={hidden ? 'Show balance' : 'Hide balance'}>
              {hidden ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="mt-[15px] mb-[30px] max-w-full overflow-wrap-anywhere text-[28px] font-medium tabular-nums tracking-[-1px] md:text-[clamp(28px,3vw,37px)]">
            {wallet.isPending ? '—' : wallet.isError ? 'Unavailable' : hidden ? '••••••' : formatNairaAmount(wallet.data?.balance ?? 0)}
          </div>
          {wallet.isError
            ? <button className={`mt-auto ${lightBtn}`} onClick={() => wallet.refetch()}>Try again</button>
            : <Link className={`mt-auto ${lightBtn}`} to="/wallet"><FiPlus />Add money</Link>}
        </section>
        <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-paper">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 md:p-[22px_24px]">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Make a payment</h2>
          </div>
          <Shortcut />
          <p className="px-5 pb-5 text-xs leading-relaxed text-muted md:px-6 md:pb-6">Choose a service to get started. Review the details before you pay.</p>
        </section>
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-paper" aria-label="Recent transactions">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 md:p-[22px_24px]">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Recent transactions</h2>
            <p className="mt-1 text-xs text-muted">A record of your latest payments.</p>
          </div>
          <Link className={textLink} to="/transactions">View all <FiArrowRight /></Link>
        </div>
        {activity.isPending ? (
          <div className="p-12 text-center" role="status"><p className="text-xs text-muted">Loading your transactions…</p></div>
        ) : activity.isError ? (
          <div className="p-12 text-center">
            <h3 className="mb-1.5 text-[15px] font-mediumish">We couldn’t load your transactions.</h3>
            <p className="mb-4 text-xs text-muted">Your wallet and payment records have not changed.</p>
            <button className={secondaryBtn} onClick={() => activity.refetch()}>Try again</button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <FiClock className="mx-auto mb-3.5 h-[26px] w-[26px] text-muted stroke-[1.4]" />
            <h3 className="mb-1.5 text-[15px] font-mediumish">Your first payment starts here.</h3>
            <p className="mb-4 text-xs text-muted">Once you make a payment, you’ll find its details and status here.</p>
            <Link className={textLink} to="/utilities">Make a payment <FiArrowRight /></Link>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] gap-[15px] border-y border-line bg-bg px-6 py-2.5 text-[10px] text-muted md:grid" aria-hidden="true">
              <span>TRANSACTION</span><span>DATE</span><span>STATUS</span><span className="text-right">AMOUNT</span>
            </div>
            <ul>
              {transactions.map((tx: any, i: number) => {
                const [tone, label] = statusStyle(tx.status);
                const reference = tx.requestId || tx.reference;
                const date = new Date(tx.createdAt || tx.transactionDate);
                const content = (
                  <>
                    <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
                      {tx.type === 'deposit' ? <FiArrowDownLeft className="shrink-0 text-lg text-muted" /> : <FiArrowUpRight className="shrink-0 text-lg text-muted" />}
                      <div className="min-w-0 overflow-wrap-anywhere">
                        <strong className="block font-mediumish capitalize leading-normal">{tx.product_name || tx.type || 'Payment'}</strong>
                        <small className="mt-0.5 block text-xs text-muted">{tx.phone || (reference ? `Ref · ${reference.slice(-8)}` : 'Wallet transaction')}</small>
                      </div>
                    </div>
                    <span className="hidden text-xs md:col-start-auto md:row-start-auto md:block">{Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <span className={`col-start-1 row-start-2 inline-flex items-center gap-1.5 pl-[30px] text-[11px] before:h-[5px] before:w-[5px] before:rounded-full before:bg-current md:col-start-auto md:row-start-auto md:pl-0 ${statusTone[tone] || 'text-muted'}`}>{label}</span>
                    <span className="col-start-2 row-start-1 text-right text-xs font-semibold tabular-nums md:col-start-auto md:row-start-auto">{formatNairaAmount(tx.debitKobo != null ? tx.debitKobo / 100 : tx.amount)}</span>
                  </>
                );
                const rowClass = 'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-line px-4 py-3.5 text-xs last:border-b-0 hover:bg-bg md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-[15px] md:px-6 md:py-5';
                return (
                  <li key={tx._id || reference || i}>
                    {reference ? <Link className={rowClass} to={`/transactions/${encodeURIComponent(reference)}`}>{content}</Link> : <div className={rowClass}>{content}</div>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line py-[18px] text-xs text-muted">
        <span className="flex items-center gap-2.5"><FiHelpCircle />Need help with a payment?</span>
        <Link className={textLink} to="/support">Contact support <FiArrowUpRight /></Link>
      </div>
    </div>
  );
}
