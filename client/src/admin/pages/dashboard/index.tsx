import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiCreditCard, FiCheckCircle, FiClock, FiXCircle, FiArrowRight } from "react-icons/fi";
import { getUser, getAllUsers, getUtilityAnalytics } from "../../api";
import { setAdminUser, setUsers } from "../../../actions/adminActions";
import { formatNairaAmount } from "../../../utils";
import Card from "./card";
import MyBarChart from "./chart";
import Shortcut from "./shortcut";

export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useQuery({ queryKey: ["admin-user"], queryFn: getUser });
  const analytics = useQuery({ queryKey: ["analytic"], queryFn: getUtilityAnalytics });
  const users = useQuery({ queryKey: ["users"], queryFn: getAllUsers });
  useEffect(() => { if (user.data) dispatch(setAdminUser(user.data)); }, [user.data, dispatch]);
  useEffect(() => { if (users.data) dispatch(setUsers(users.data.users)); }, [users.data, dispatch]);
  const overall = analytics.data?.overall;
  const chartData = (analytics.data?.monthly || []).map((item: any) => ({ _id: item._id || 'No data', totalRevenue: item.totalRevenue || 0, totalGross: item.totalGross || 0 }));

  return <div className="ot-admin-dashboard">
    <div className="ot-dashboard-heading"><div><h1>Platform overview</h1><p>Monitor payments, customers, and day-to-day operations.</p></div><span className="ot-admin-label">Administration</span></div>
    {user.isError && <p className="ot-field-error" role="alert">Couldn’t load your profile. <button onClick={() => user.refetch()}>Try again</button></p>}
    {analytics.isPending ? <div className="ot-panel ot-empty" role="status">Loading platform metrics…</div> : analytics.isError ? <div className="ot-panel ot-empty" role="alert"><p>Couldn’t load transaction analytics.</p><button className="ot-button ot-button-secondary" onClick={() => analytics.refetch()}>Try again</button></div> : <div className="ot-admin-metrics">
      <Card title="Total transactions" count={overall?.totalTransactions || 0} icon={FiCreditCard} />
      <Card title="Delivered" count={overall?.totalDelivered || 0} icon={FiCheckCircle} />
      <Card title="Pending" count={overall?.totalPending || 0} icon={FiClock} />
      <Card title="Failed" count={overall?.totalFailed || 0} icon={FiXCircle} />
    </div>}
    <section className="ot-panel"><div className="ot-panel-heading"><div><h2>Transaction analytics</h2><p>Monthly revenue and gross totals.</p></div><Link className="ot-text-link" to="/admin/transactions">Transactions <FiArrowRight /></Link></div>
      <div className="ot-admin-chart">{analytics.isPending ? <div className="ot-empty">Loading chart…</div> : analytics.isError ? <div className="ot-empty">Analytics are currently unavailable.</div> : chartData.length ? <MyBarChart data={chartData} /> : <div className="ot-empty">Transaction activity will appear here.</div>}</div>
    </section>
    <div className="ot-admin-overview-bottom">
      <section className="ot-panel"><div className="ot-panel-heading"><h2>Quick actions</h2></div><Shortcut /></section>
      <section className="ot-panel"><div className="ot-panel-heading"><h2>At a glance</h2></div><dl className="ot-admin-summary"><div><dt>Registered users</dt><dd>{users.isPending ? '—' : users.isError ? <button className="ot-dropdown-text-button" onClick={() => users.refetch()}>Retry</button> : (users.data?.totalCount || 0).toLocaleString()}</dd></div><div><dt>Total revenue</dt><dd>{analytics.isPending ? '—' : analytics.isError ? 'Unavailable' : formatNairaAmount(overall?.totalRevenue || 0)}</dd></div></dl></section>
    </div>
  </div>;
}
