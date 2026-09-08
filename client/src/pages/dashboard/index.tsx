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
  return <div className="ot-dashboard">
    <div className="ot-dashboard-heading"><div><h1>Your overview</h1><p>{user.data?.username ? `Welcome back, ${user.data.username}.` : 'Your payments, all in one place.'}</p></div><span className="ot-date">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
    {!hideBanner && supported && <div className="ot-push-banner">
      <span className="ot-push-copy"><FiBell /> Enable push notifications to get real-time updates.</span>
      <div className="ot-push-actions">
        <button onClick={subscribe} disabled={loading} className="ot-button ot-button-primary">{loading ? 'Enabling…' : 'Enable'}</button>
        <button onClick={() => { localStorage.setItem('push_banner_dismissed','1'); setDismissed(true); }} className="ot-button ot-button-secondary">Later</button>
      </div>
    </div>}
    {user.isError && <p role="alert" className="ot-field-error mb-4">We couldn’t load your profile. <button onClick={() => user.refetch()}>Try again</button></p>}
    <div className="ot-overview">
      <section className="ot-balance" aria-label="Wallet balance"><div className="ot-balance-label">Available balance<button onClick={() => setHidden(!hidden)} aria-label={hidden ? 'Show balance' : 'Hide balance'}>{hidden ? <FiEyeOff /> : <FiEye />}</button></div>
        <div className="ot-balance-amount">{wallet.isPending ? '—' : wallet.isError ? 'Unavailable' : hidden ? '••••••' : formatNairaAmount(wallet.data?.balance ?? 0)}</div>
        {wallet.isError ? <button className="ot-button ot-button-light" onClick={() => wallet.refetch()}>Try again</button> : <Link className="ot-button ot-button-light" to="/wallet"><FiPlus />Add money</Link>}
      </section>
      <section className="ot-panel"><div className="ot-panel-heading"><h2>Make a payment</h2></div><Shortcut /><p className="ot-payment-note">Choose a service to get started. Review the details before you pay.</p></section>
    </div>
    <section className="ot-panel" aria-label="Recent transactions"><div className="ot-panel-heading"><div><h2>Recent transactions</h2><p>A record of your latest payments.</p></div><Link className="ot-text-link" to="/transactions">View all <FiArrowRight /></Link></div>
      {activity.isPending ? <div className="ot-empty" role="status"><p>Loading your transactions…</p></div> : activity.isError ? <div className="ot-empty"><h3>We couldn’t load your transactions.</h3><p>Your wallet and payment records have not changed.</p><button className="ot-button ot-button-secondary" onClick={() => activity.refetch()}>Try again</button></div> : transactions.length === 0 ? <div className="ot-empty"><FiClock /><h3>Your first payment starts here.</h3><p>Once you make a payment, you’ll find its details and status here.</p><Link className="ot-text-link" to="/utilities">Make a payment <FiArrowRight /></Link></div> : <>
        <div className="ot-activity-header" aria-hidden="true"><span>TRANSACTION</span><span>DATE</span><span>STATUS</span><span className="text-right">AMOUNT</span></div>
        <ul>{transactions.map((tx: any, i: number) => {
          const [tone, label] = statusStyle(tx.status);
          const reference = tx.requestId || tx.reference;
          const date = new Date(tx.createdAt || tx.transactionDate);
          const content = <><div className="ot-activity-name">{tx.type === 'deposit' ? <FiArrowDownLeft /> : <FiArrowUpRight />}<div><strong>{tx.product_name || tx.type || 'Payment'}</strong><small>{tx.phone || (reference ? `Ref · ${reference.slice(-8)}` : 'Wallet transaction')}</small></div></div><span className="ot-activity-date">{Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span><span className={`ot-status ot-status-${tone}`}>{label}</span><span className="ot-activity-amount">{formatNairaAmount(tx.amount)}</span></>;
          return <li key={tx._id || reference || i}>{reference ? <Link className="ot-activity-row" to={`/transactions/${encodeURIComponent(reference)}`}>{content}</Link> : <div className="ot-activity-row">{content}</div>}</li>;
        })}</ul>
      </>}
    </section>
    <div className="ot-dashboard-help"><span><FiHelpCircle />Need help with a payment?</span><Link className="ot-text-link" to="/support">Contact support <FiArrowUpRight /></Link></div>
  </div>;
}
