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

const secondaryBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-tint';
const textLink = 'inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-accent hover:underline hover:underline-offset-4';

export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useQuery({ queryKey: ["admin-user"], queryFn: getUser });
  const analytics = useQuery({ queryKey: ["analytic"], queryFn: getUtilityAnalytics });
  const users = useQuery({ queryKey: ["users"], queryFn: getAllUsers });
  useEffect(() => { if (user.data) dispatch(setAdminUser(user.data)); }, [user.data, dispatch]);
  useEffect(() => { if (users.data) dispatch(setUsers(users.data.users)); }, [users.data, dispatch]);
  const overall = analytics.data?.overall;
  const chartData = (analytics.data?.monthly || []).map((item: any) => ({ _id: item._id || 'No data', totalRevenue: item.totalRevenue || 0, totalGross: item.totalGross || 0 }));

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="mb-0 flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-[26px] font-mediumish leading-tight tracking-[-0.6px]">Platform overview</h1>
          <p className="text-[13px] text-muted">Monitor payments, customers, and day-to-day operations.</p>
        </div>
        <span className="hidden rounded border border-line px-2.5 py-1.5 text-[10px] text-muted md:inline">Administration</span>
      </div>
      {user.isError && <p className="text-[11px] text-danger" role="alert">Couldn’t load your profile. <button className="underline" onClick={() => user.refetch()}>Try again</button></p>}
      {analytics.isPending ? (
        <div className="rounded-lg border border-line bg-paper p-12 text-center text-xs text-muted" role="status">Loading platform metrics…</div>
      ) : analytics.isError ? (
        <div className="rounded-lg border border-line bg-paper p-12 text-center" role="alert">
          <p className="mb-4 text-xs text-muted">Couldn’t load transaction analytics.</p>
          <button className={secondaryBtn} onClick={() => analytics.refetch()}>Try again</button>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 nav:grid-cols-4">
          <Card title="Total transactions" count={overall?.totalTransactions || 0} icon={FiCreditCard} />
          <Card title="Delivered" count={overall?.totalDelivered || 0} icon={FiCheckCircle} />
          <Card title="Pending" count={overall?.totalPending || 0} icon={FiClock} />
          <Card title="Failed" count={overall?.totalFailed || 0} icon={FiXCircle} />
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-line bg-paper">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Transaction analytics</h2>
            <p className="mt-1 text-xs text-muted">Monthly revenue and gross totals.</p>
          </div>
          <Link className={textLink} to="/admin/transactions">Transactions <FiArrowRight /></Link>
        </div>
        <div className="min-w-0 px-4 pb-5 nav:px-5">
          {analytics.isPending ? (
            <div className="p-10 text-center text-xs text-muted">Loading chart…</div>
          ) : analytics.isError ? (
            <div className="p-10 text-center text-xs text-muted">Analytics are currently unavailable.</div>
          ) : chartData.length ? (
            <MyBarChart data={chartData} />
          ) : (
            <div className="p-10 text-center text-xs text-muted">Transaction activity will appear here.</div>
          )}
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-6 nav:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-lg border border-line bg-paper">
          <div className="flex items-center justify-between gap-4 p-5 nav:p-[22px_24px]">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Quick actions</h2>
          </div>
          <Shortcut />
        </section>
        <section className="overflow-hidden rounded-lg border border-line bg-paper">
          <div className="flex items-center justify-between gap-4 p-5 nav:p-[22px_24px]">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">At a glance</h2>
          </div>
          <dl className="px-6 pb-4">
            <div className="flex items-center justify-between gap-4 border-t border-line py-[15px] text-xs">
              <dt className="text-muted">Registered users</dt>
              <dd className="m-0 font-mediumish tabular-nums">
                {users.isPending ? '—' : users.isError
                  ? <button className="text-[11px] text-accent" onClick={() => users.refetch()}>Retry</button>
                  : (users.data?.totalCount || 0).toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line py-[15px] text-xs">
              <dt className="text-muted">Total revenue</dt>
              <dd className="m-0 font-mediumish tabular-nums">
                {analytics.isPending ? '—' : analytics.isError ? 'Unavailable' : formatNairaAmount(overall?.totalRevenue || 0)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
