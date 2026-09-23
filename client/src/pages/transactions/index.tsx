import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiClock, FiSearch, FiSmartphone, FiWifi, FiZap, FiTv } from "react-icons/fi";
import { getAllUtilityTransactions } from "../../api";
import { formatNairaAmount } from "../../utils";

const services = [
  ["Data Services", "Data", FiWifi],
  ["Airtime Recharge", "Airtime", FiSmartphone],
  ["Electricity Bill", "Electricity", FiZap],
  ["TV Subscription", "TV", FiTv],
] as const;

const secondaryBtn =
  "inline-flex min-h-[38px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink transition hover:bg-tint disabled:opacity-45 disabled:cursor-not-allowed";

function statusTone(status: string) {
  if (["completed", "successful", "delivered"].includes(status)) return ["success", "Completed"];
  if (["failed", "rejected"].includes(status)) return ["failed", status === "rejected" ? "Rejected" : "Failed"];
  return ["pending", status === "review_needed" ? "Under review" : status === "approved" ? "Approved" : "Pending"];
}

const statusClass: Record<string, string> = {
  success: "text-success dark:text-success-dark",
  pending: "text-warning dark:text-warning-dark",
  failed: "text-danger dark:text-danger-dark",
};

const activityRow =
  "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-line px-4 py-3.5 text-xs last:border-b-0 hover:bg-bg md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-4 md:px-6 md:py-5";

export default function Transactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("Data Services");
  const [requestId, setRequestId] = useState("");
  const { data, isError, isPending, refetch } = useQuery({
    queryKey: ["transactions", currentPage, 10, activeTab, requestId],
    queryFn: () => getAllUtilityTransactions(currentPage, 10, activeTab, requestId),
  });
  const transactions = data?.transactions ?? [];
  const totalPages = data?.totalPages ?? 0;
  const selectedService = services.find(([id]) => id === activeTab)!;
  const ServiceIcon = selectedService[2];

  return (
    <div className="min-w-0">
      <div className="mb-[30px] flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">Transactions</h1>
          <p className="text-[13px] text-muted">Your payments and their latest status.</p>
        </div>
      </div>

      <nav className="flex flex-wrap gap-6 border-b border-line" aria-label="Transaction services">
        {services.map(([id, label, Icon]) => (
          <button
            key={id}
            aria-pressed={activeTab === id}
            onClick={() => {
              setActiveTab(id);
              setCurrentPage(1);
              setRequestId("");
            }}
            className={[
              "-mb-px flex min-h-11 items-center gap-2 border-b-2 pb-3 text-xs font-mediumish transition-colors",
              activeTab === id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink",
            ].join(" ")}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      <section className="mt-5 overflow-hidden rounded-lg border border-line bg-paper" aria-label={`${selectedService[1]} transactions`}>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]">
          <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Payment history</h2>
          <label className="relative w-full max-w-[300px] max-md:max-w-none">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <span className="sr-only">Search by reference</span>
            <input
              className="h-11 w-full rounded-md border border-line bg-bg px-3 pl-[37px] text-xs text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40"
              type="search"
              placeholder="Search by reference…"
              value={requestId}
              onChange={(event) => {
                setRequestId(event.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
        </div>

        {isPending ? (
          <div className="p-12 text-center" role="status">
            <p className="text-xs text-muted">Loading your transactions…</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <h3 className="mb-1.5 text-[15px] font-mediumish">We couldn’t load your transactions.</h3>
            <p className="mb-4 text-xs text-muted">Please try again in a moment.</p>
            <button className={secondaryBtn} onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <FiClock className="mx-auto mb-3.5 h-[26px] w-[26px] text-muted stroke-[1.4]" />
            <h3 className="mb-1.5 text-[15px] font-mediumish">
              {requestId ? "No matching transactions" : "No transactions yet"}
            </h3>
            <p className="mb-4 text-xs text-muted">
              {requestId
                ? "Try a different payment reference."
                : `Your ${selectedService[1].toLowerCase()} payments will appear here.`}
            </p>
            {requestId && (
              <button
                className="inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-accent hover:underline hover:underline-offset-4"
                onClick={() => {
                  setRequestId("");
                  setCurrentPage(1);
                }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className="hidden grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-y border-line bg-bg px-6 py-2.5 text-[10px] text-muted md:grid"
              aria-hidden="true"
            >
              <span>TRANSACTION</span>
              <span>DATE</span>
              <span>STATUS</span>
              <span className="text-right">AMOUNT</span>
            </div>
            <ul>
              {transactions.map((transaction: any) => {
                const [tone, label] = statusTone(transaction.status);
                const reference = transaction.reference || transaction.requestId;
                const date = new Date(transaction.createdAt);
                const token = transaction.token?.includes(":")
                  ? transaction.token.split(":").slice(1).join(":").trim()
                  : transaction.token;
                const content = (
                  <>
                    <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
                      <ServiceIcon className="shrink-0 text-lg text-muted" />
                      <div className="min-w-0 overflow-wrap-anywhere">
                        <strong className="block font-mediumish capitalize leading-normal">
                          {transaction.product_name || transaction.serviceID || selectedService[1]}
                        </strong>
                        <small className="mt-0.5 block text-xs text-muted">{transaction.phone}</small>
                        {activeTab === "Electricity Bill" && (
                          <small className="mt-0.5 block text-xs text-muted">
                            {transaction.units != null && `Units: ${transaction.units}`}
                            {token && ` · Token: ${token}`}
                          </small>
                        )}
                      </div>
                    </div>
                    <span className="hidden text-xs md:col-start-auto md:row-start-auto md:block">
                      {Number.isNaN(date.getTime())
                        ? "—"
                        : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span
                      className={`col-start-1 row-start-2 inline-flex items-center gap-1.5 pl-[30px] text-[11px] before:h-[5px] before:w-[5px] before:rounded-full before:bg-current md:col-start-auto md:row-start-auto md:pl-0 ${statusClass[tone] || "text-muted"}`}
                    >
                      {label}
                    </span>
                    <span className="col-start-2 row-start-1 text-right text-xs font-semibold tabular-nums md:col-start-auto md:row-start-auto">
                      {formatNairaAmount(transaction.debitKobo != null ? transaction.debitKobo / 100 : transaction.amount)}
                    </span>
                  </>
                );
                return (
                  <li key={transaction.id || transaction._id || reference}>
                    {reference ? (
                      <Link
                        className={activityRow}
                        to={`/transactions/${encodeURIComponent(reference)}`}
                        aria-label={`View ${transaction.product_name || selectedService[1]} transaction ${reference}`}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={activityRow}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            {totalPages > 1 && (
              <nav className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 text-[11px] text-muted" aria-label="Transaction pages">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={secondaryBtn}
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className={secondaryBtn}
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
