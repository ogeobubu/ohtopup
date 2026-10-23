import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiPlus, FiArrowRight, FiArrowDownLeft, FiArrowUpRight, FiClock, FiHelpCircle, FiEye, FiEyeOff, FiBell, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
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

function TransactionSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your transactions…</span>
      <div aria-hidden="true">
        <div className="hidden h-10 border-y border-line bg-bg md:block" />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-b border-line px-4 py-4 last:border-b-0 motion-safe:animate-pulse md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto] md:items-center md:gap-[15px] md:px-6 md:py-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-[18px] shrink-0 rounded bg-line" />
              <div className="min-w-0 flex-1 space-y-2"><div className="h-4 w-28 max-w-full rounded bg-line" /><div className="h-3 w-24 max-w-full rounded bg-line" /></div>
            </div>
            <div className="col-start-1 row-start-3 ml-[30px] h-3 w-36 max-w-full rounded bg-line md:col-start-2 md:row-start-1 md:ml-0 md:w-28" />
            <div className="col-start-1 row-start-2 ml-[30px] h-4 w-20 rounded bg-line md:col-start-3 md:row-start-1 md:ml-0" />
            <div className="col-start-2 row-start-1 h-4 w-16 justify-self-end rounded bg-line md:col-start-4" />
            <div className="col-start-2 row-start-3 h-3 w-14 justify-self-end rounded bg-line md:col-start-5 md:row-start-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const dashboardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = dashboardRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sections = Array.from(root.querySelectorAll<HTMLElement>('section, [data-scroll-reveal]'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('scroll-reveal-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    const revealAll = () => {
      observer.disconnect();
      sections.forEach(section => section.classList.remove('scroll-reveal-pending'));
    };
    const onPreferenceChange = () => { if (preference.matches) revealAll(); };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) event.target.closest('.scroll-reveal-pending')?.classList.remove('scroll-reveal-pending');
    };
    if (!preference.matches) {
      sections.forEach(section => {
        section.classList.add('scroll-reveal');
        // Above-the-fold content stays visible immediately.
        if (section.getBoundingClientRect().top >= window.innerHeight) {
          section.classList.add('scroll-reveal-pending');
          observer.observe(section);
        }
      });
    }
    preference.addEventListener('change', onPreferenceChange);
    root.addEventListener('focusin', onFocus);
    return () => {
      revealAll();
      preference.removeEventListener('change', onPreferenceChange);
      root.removeEventListener('focusin', onFocus);
    };
  }, []);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [hidden, setHidden] = useState(false);
  const user = useQuery({ queryKey: ['user'], queryFn: getUser });
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: getWallet });
  const activity = useQuery({ queryKey: ['recent-transactions', type, status], queryFn: () => getTransactions(type, 1, 5, undefined, status) });
  const { supported, isSubscribed, subscribe, loading } = usePushNotifications();
  useEffect(() => { if (user.data) dispatch(setUser(user.data)); }, [user.data, dispatch]);
  const transactions = activity.data?.transactions || [];
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('push_banner_dismissed') === '1');
  const hideBanner = isSubscribed || dismissed;
  return (
    <div ref={dashboardRef} className="dashboard-motion min-w-0">
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
          <div className="mt-2 mb-5 md:mt-[15px] md:mb-[30px] max-w-full overflow-wrap-anywhere text-[28px] font-medium tabular-nums tracking-[-1px] md:text-[clamp(28px,3vw,37px)]">
            {wallet.isPending ? <span role="status" className="block"><span className="sr-only">Loading your balance…</span><span aria-hidden="true" className="block h-[34px] w-40 rounded bg-white/20 motion-safe:animate-pulse md:h-[45px]" /></span> : wallet.isError ? 'Unavailable' : hidden ? '••••••' : formatNairaAmount(wallet.data?.balance ?? 0)}
          </div>
          <span role="status" aria-live="polite" className="sr-only">{wallet.isFetching && !wallet.isPending ? 'Updating balance…' : ''}</span>
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

      <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-paper" aria-label="Recent transactions" aria-busy={activity.isFetching}>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 md:p-[22px_24px]">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Recent transactions</h2>
            <p role="status" aria-live="polite" className="mt-1 text-xs text-muted">{activity.isFetching && !activity.isPending ? 'Updating transactions…' : 'A record of your latest payments.'}</p>
          </div>
          <Link className={textLink} to="/transactions">View all <FiArrowRight /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 border-y border-line bg-bg px-4 py-3 md:grid-cols-[minmax(0,200px)_minmax(0,200px)_auto] md:items-end md:px-6">
          <label className="flex min-w-0 flex-col gap-1.5 text-xs text-muted">Service
            <select value={type} onChange={e => setType(e.target.value)} className="min-h-11 w-full min-w-0 rounded-md border border-line bg-paper px-2 text-ink">
              <option value="">All services</option>
              {['data', 'airtime', 'electricity', 'cable', 'deposit', 'withdrawal'].map(value => <option key={value} value={value}>{value === 'cable' ? 'TV' : value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs text-muted">Status
            <select value={status} onChange={e => setStatus(e.target.value)} className="min-h-11 w-full min-w-0 rounded-md border border-line bg-paper px-2 text-ink">
              <option value="">All statuses</option>
              {['completed', 'delivered', 'successful', 'pending', 'initiated', 'processing', 'approved', 'failed', 'rejected', 'review_needed'].map(value => <option key={value} value={value}>{value === 'review_needed' ? 'Under review' : value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
            </select>
          </label>
          {(type || status) && <button type="button" className="col-span-2 min-h-11 justify-self-start text-xs font-semibold text-accent hover:underline md:col-span-1 md:px-2" onClick={() => { setType(''); setStatus(''); }}>Clear filters</button>}
        </div>
        {activity.isPending ? (
          <TransactionSkeleton />
        ) : activity.isError ? (
          <div className="p-12 text-center">
            <h3 className="mb-1.5 text-[15px] font-mediumish">We couldn’t load your transactions.</h3>
            <p className="mb-4 text-xs text-muted">Your wallet and payment records have not changed.</p>
            <button className={secondaryBtn} onClick={() => activity.refetch()}>Try again</button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <FiClock className="mx-auto mb-3.5 h-[26px] w-[26px] text-muted stroke-[1.4]" />
            <h3 className="mb-1.5 text-[15px] font-mediumish">{type || status ? 'No matching transactions.' : 'Your first payment starts here.'}</h3>
            <p className="mb-4 text-xs text-muted">{type || status ? 'Try another service or status, or clear your filters.' : 'Once you make a payment, you’ll find its details and status here.'}</p>
            {type || status ? <button type="button" className={textLink} onClick={() => { setType(''); setStatus(''); }}>Show all recent activity <FiArrowRight /></button> : <Link className={textLink} to="/utilities">Make a payment <FiArrowRight /></Link>}
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto] gap-[15px] border-y border-line bg-bg px-6 py-2.5 text-[10px] text-muted md:grid" aria-hidden="true">
              <span>TRANSACTION</span><span>DATE</span><span>STATUS</span><span className="text-right">AMOUNT</span><span className="w-14 text-right">DETAILS</span>
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
                    <span className="col-start-1 row-start-3 pl-[30px] text-[11px] text-muted md:col-start-auto md:row-start-auto md:pl-0">{Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="col-span-2 col-start-1 row-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[30px] text-[11px] md:col-span-1 md:col-start-auto md:row-start-auto md:flex-col md:items-start md:pl-0">
                      <span className={`inline-flex items-center gap-1.5 before:h-[5px] before:w-[5px] before:rounded-full before:bg-current ${statusTone[tone] || 'text-muted'}`}>{label}</span>
                      {tx.refundStatus === 'refunded' && <span className="inline-flex items-center gap-1 text-success dark:text-success-dark"><FiCheckCircle aria-hidden="true" />Refunded to wallet</span>}
                    </div>
                    <div className="col-start-2 row-start-1 text-right md:col-start-auto md:row-start-auto">
                      <span className="block whitespace-nowrap text-xs font-semibold tabular-nums">{tx.walletDirection === 'credit' ? '+' : tx.walletDirection === 'debit' ? '−' : ''}{formatNairaAmount(tx.walletAmountKobo != null ? tx.walletAmountKobo / 100 : tx.debitKobo != null ? tx.debitKobo / 100 : tx.amount)}</span>
                      {!tx.walletDirection && <small className="mt-1 block text-[10px] text-muted">Transaction amount</small>}
                    </div>
                    {reference && <span className="col-start-2 row-start-3 flex items-center justify-end gap-1 text-[11px] text-accent md:col-start-5 md:row-start-1 md:w-14">Details <FiChevronRight aria-hidden="true" /></span>}

                  </>
                );
                const rowClass = 'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-4 text-xs hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto] md:gap-[15px] md:px-6 md:py-5';
                return (
                  <li key={tx._id || reference || i} className="border-t border-line first:border-t-0">
                    {reference ? <Link className={rowClass} to={`/transactions/${encodeURIComponent(reference)}`}>{content}</Link> : <div className={rowClass}>{content}</div>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <div data-scroll-reveal className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line py-[18px] text-xs text-muted">
        <span className="flex items-center gap-2.5"><FiHelpCircle />Need help with a payment?</span>
        <Link className={textLink} to="/support">Contact support <FiArrowUpRight /></Link>
      </div>
    </div>
  );
}
