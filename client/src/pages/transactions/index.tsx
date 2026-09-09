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

function statusStyle(status: string) {
  if (["completed", "successful", "delivered"].includes(status)) return ["success", "Completed"];
  if (["failed", "rejected"].includes(status)) return ["failed", status === "rejected" ? "Rejected" : "Failed"];
  return ["pending", status === "review_needed" ? "Under review" : status === "approved" ? "Approved" : "Pending"];
}

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
    <div className="ot-transactions">
      <div className="ot-dashboard-heading">
        <div><h1>Transactions</h1><p>Your payments and their latest status.</p></div>
      </div>
      <nav className="ot-utility-tabs" aria-label="Transaction services">
        {services.map(([id, label, Icon]) => (
          <button key={id} aria-pressed={activeTab === id} onClick={() => {
            setActiveTab(id);
            setCurrentPage(1);
            setRequestId("");
          }}><Icon />{label}</button>
        ))}
      </nav>
      <section className="ot-panel" aria-label={`${selectedService[1]} transactions`}>
        <div className="ot-panel-heading ot-transactions-toolbar">
          <h2>Payment history</h2>
          <label className="ot-transactions-search">
            <FiSearch aria-hidden="true" />
            <span className="sr-only">Search by reference</span>
            <input className="ot-field" type="search" placeholder="Search by reference…" value={requestId} onChange={(event) => {
              setRequestId(event.target.value);
              setCurrentPage(1);
            }} />
          </label>
        </div>
        {isPending ? (
          <div className="ot-empty" role="status"><p>Loading your transactions…</p></div>
        ) : isError ? (
          <div className="ot-empty" role="alert"><h3>We couldn’t load your transactions.</h3><p>Please try again in a moment.</p><button className="ot-button ot-button-secondary" onClick={() => refetch()}>Try again</button></div>
        ) : transactions.length === 0 ? (
          <div className="ot-empty"><FiClock /><h3>{requestId ? "No matching transactions" : "No transactions yet"}</h3><p>{requestId ? "Try a different payment reference." : `Your ${selectedService[1].toLowerCase()} payments will appear here.`}</p>{requestId && <button className="ot-text-link" onClick={() => { setRequestId(""); setCurrentPage(1); }}>Clear search</button>}</div>
        ) : (
          <>
            <div className="ot-activity-header" aria-hidden="true"><span>TRANSACTION</span><span>DATE</span><span>STATUS</span><span className="text-right">AMOUNT</span></div>
            <ul className="ot-transactions-list">
              {transactions.map((transaction: any) => {
                const [tone, label] = statusStyle(transaction.status);
                const date = new Date(transaction.createdAt);
                const token = transaction.token?.includes(":") ? transaction.token.split(":").slice(1).join(":").trim() : transaction.token;
                return (
                  <li key={transaction._id || transaction.requestId}>
                    <Link className="ot-activity-row" to={`/transactions/${encodeURIComponent(transaction.requestId)}`} aria-label={`View ${transaction.product_name || selectedService[1]} transaction ${transaction.requestId}`}>
                      <div className="ot-activity-name"><ServiceIcon /><div>
                        <strong>{transaction.product_name || transaction.serviceID || selectedService[1]}</strong>
                        <small>{transaction.phone}</small>
                        {activeTab === "Electricity Bill" && <small>{transaction.units != null && `Units: ${transaction.units}`}{token && ` · Token: ${token}`}</small>}
                      </div></div>
                      <time className="ot-activity-date" dateTime={Number.isNaN(date.getTime()) ? undefined : date.toISOString()}>{Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time>
                      <span className={`ot-status ot-status-${tone}`}>{label}</span>
                      <span className="ot-activity-amount">{formatNairaAmount(transaction.debitKobo != null ? transaction.debitKobo / 100 : transaction.amount)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {totalPages > 1 && <nav className="ot-transactions-pagination" aria-label="Transaction pages">
              <span>Page {currentPage} of {totalPages}</span>
              <div><button className="ot-button ot-button-secondary" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button><button className="ot-button ot-button-secondary" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div>
            </nav>}
          </>
        )}
      </section>
    </div>
  );
}
