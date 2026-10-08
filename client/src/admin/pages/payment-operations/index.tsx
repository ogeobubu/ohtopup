import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiRefreshCw, FiRepeat, FiXCircle } from "react-icons/fi";
import { getPaymentOperations, requeuePaymentEvent } from "../../api";

const money = value => `₦${Number(value || 0).toLocaleString()}`;
const when = value => value ? new Date(value).toLocaleString() : "—";

export default function PaymentOperations() {
  const queryClient = useQueryClient();
  const operations = useQuery({ queryKey: ["payment-operations"], queryFn: getPaymentOperations, refetchInterval: 30000 });
  const requeue = useMutation({
    mutationFn: requeuePaymentEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-operations"] }),
  });
  const summary = operations.data?.summary;

  if (operations.isPending) return <div className="rounded-lg border border-line bg-paper p-12 text-center text-xs text-muted" role="status">Loading payment health…</div>;
  if (operations.isError) return <div className="rounded-lg border border-line bg-paper p-12 text-center" role="alert"><p className="mb-4 text-xs text-muted">Payment health is currently unavailable.</p><button className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white" onClick={() => operations.refetch()}>Try again</button></div>;

  return <div className="flex flex-col gap-5 md:gap-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="mb-2 text-[26px] font-mediumish leading-tight tracking-[-0.6px]">Payment operations</h1><p className="text-[13px] text-muted">Review delayed purchases and webhook events that need attention.</p></div>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-paper px-4 text-xs font-semibold text-ink hover:bg-tint" onClick={() => operations.refetch()} disabled={operations.isFetching}><FiRefreshCw className={operations.isFetching ? "animate-spin" : ""}/> Refresh</button>
    </header>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Events for review", summary?.reviewEvents, FiAlertTriangle, "text-warning"],
        ["Stale purchases", summary?.stalePurchases, FiClock, "text-danger"],
        ["Review purchases", summary?.reviewPurchases, FiXCircle, "text-danger"],
        ["Pending events", summary?.pendingEvents, FiRepeat, "text-accent"],
      ].map(([label, value, Icon, color]) => <div key={label} className="rounded-lg border border-line bg-paper p-5"><Icon className={`mb-4 text-xl ${color}`} /><span className="block text-[11px] text-muted">{label}</span><strong className="mt-1 block text-2xl tabular-nums">{Number(value || 0).toLocaleString()}</strong></div>)}
    </div>

    {(summary?.overdueEvents > 0 || summary?.expiredLeases > 0) && <div className="flex items-start gap-3 rounded-lg border border-danger bg-danger-surface p-4 text-xs text-danger-ink dark:bg-danger-surface-dark dark:text-danger-ink-dark" role="alert"><FiAlertTriangle className="mt-0.5 shrink-0"/><div><strong>Worker attention required</strong><p className="mt-1">{summary.overdueEvents} event(s) are due for processing and {summary.expiredLeases} processing lease(s) have expired.</p></div></div>}

    <section className="overflow-hidden rounded-lg border border-line bg-paper">
      <div className="border-b border-line p-5"><h2 className="text-[15px] font-semibold">Webhook events awaiting review</h2><p className="mt-1 text-xs text-muted">Requeue only after the underlying provider or configuration issue has been corrected.</p></div>
      {operations.data.reviewEvents.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-tint text-[10px] uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">Event</th><th className="px-5 py-3">Attempts</th><th className="px-5 py-3">Last error</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{operations.data.reviewEvents.map(event => <tr key={event._id} className="border-t border-line"><td className="max-w-[190px] truncate px-5 py-4 font-mono text-[10px]" title={event.key}>{event.key}</td><td className="px-5 py-4 tabular-nums">{event.attempts}</td><td className="max-w-[280px] px-5 py-4 text-muted">{event.lastError || "No error recorded"}</td><td className="px-5 py-4 text-muted">{when(event.updatedAt)}</td><td className="px-5 py-4 text-right"><button className="inline-flex min-h-9 items-center gap-2 rounded border border-line px-3 font-semibold hover:bg-tint disabled:opacity-50" disabled={requeue.isPending} onClick={() => requeue.mutate(event._id)}><FiRepeat/> Requeue</button></td></tr>)}</tbody></table></div> : <div className="flex items-center justify-center gap-2 p-10 text-xs text-success"><FiCheckCircle/> No webhook events need manual review.</div>}
      {requeue.isError && <p className="border-t border-line p-4 text-xs text-danger" role="alert">{requeue.error.message}</p>}
    </section>

    <section className="overflow-hidden rounded-lg border border-line bg-paper">
      <div className="border-b border-line p-5"><h2 className="text-[15px] font-semibold">Purchase reconciliation queue</h2><p className="mt-1 text-xs text-muted">Pending purchases older than {operations.data.thresholds.stalePurchaseMinutes} minutes and purchases already marked for review.</p></div>
      {operations.data.purchaseQueue.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-tint text-[10px] uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">Request</th><th className="px-5 py-3">Service</th><th className="px-5 py-3">Provider</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Last updated</th></tr></thead><tbody>{operations.data.purchaseQueue.map(item => <tr key={item._id} className="border-t border-line"><td className="px-5 py-4 font-mono text-[10px]">{item.requestId}</td><td className="px-5 py-4 capitalize">{item.type || item.serviceID}</td><td className="px-5 py-4 capitalize text-muted">{item.provider || "—"}</td><td className="px-5 py-4 tabular-nums">{money(item.amount)}</td><td className="px-5 py-4"><span className="rounded-full bg-tint px-2 py-1 text-[10px] font-semibold uppercase">{item.status}</span></td><td className="px-5 py-4 text-muted">{when(item.updatedAt)}</td></tr>)}</tbody></table></div> : <div className="flex items-center justify-center gap-2 p-10 text-xs text-success"><FiCheckCircle/> No purchases currently require reconciliation.</div>}
    </section>
  </div>;
}
