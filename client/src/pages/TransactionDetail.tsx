import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaArrowLeft, FaPrint, FaCopy, FaCheck } from "react-icons/fa";
import { getTransactionDetails } from "../api";
import { formatNairaAmount } from "../utils";

const secondaryBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-[15px] py-[11px] text-[13px] font-semibold text-ink transition hover:bg-tint disabled:opacity-45";
const primaryBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark";

function DetailRow({ label, value, color }: { label: string; value: unknown; color?: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span
        title={String(value ?? "N/A")}
        className="min-w-0 break-words text-[13px] font-medium [overflow-wrap:anywhere] sm:max-w-[65%] sm:text-right"
        style={{ color: color || "var(--ot-ink)" }}
      >
        {String(value ?? "N/A")}
      </span>
    </div>
  );
}

const TransactionDetail = () => {
  const { requestId } = useParams();
  const hasValidReference = Boolean(requestId && requestId !== "undefined" && requestId !== "null");
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);
  const printRootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const cleanUp = () => {
      printRootRef.current?.remove();
      printRootRef.current = null;
    };
    window.addEventListener('afterprint', cleanUp);
    return () => {
      window.removeEventListener('afterprint', cleanUp);
      cleanUp();
    };
  }, []);
  const printReceipt = () => {
    if (!receiptRef.current) return;
    printRootRef.current?.remove();
    const printRoot = document.createElement('div');
    printRoot.className = 'receipt-print-only';
    const brand = document.createElement('h1');
    brand.textContent = 'OhTopUp · Transaction receipt';
    brand.style.cssText = 'font-size:18pt;margin-bottom:20px;font-weight:600';
    printRoot.append(brand, receiptRef.current.cloneNode(true));
    document.body.appendChild(printRoot);
    printRootRef.current = printRoot;
    // The printable copy lives outside app containers and their overflow rules.
    window.print();
  };
  const [copyMessage, setCopyMessage] = useState('');
  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(String(reference));
      setCopyMessage('Reference copied');
    } catch {
      setCopyMessage('Couldn’t copy. Select the reference to copy it manually.');
    }
  };

  const { data: transactionData, isLoading, error } = useQuery({
    queryKey: ["transaction-detail", requestId],
    queryFn: () => getTransactionDetails(requestId),
    enabled: hasValidReference,
  });

  const transaction = transactionData?.transaction;
  const reference = transaction?.reference || transaction?.requestId;
  const transactionId = transaction?.id || transaction?._id;
  const transactionDate = transaction?.createdAt || transaction?.transactionDate;

  const statusColor = (s: string) => {
    if (s === "delivered" || s === "completed" || s === "successful") return "#27805d";
    if (s === "pending") return "#9a6818";
    if (s === "failed") return "#b84545";
    return "var(--ot-muted)";
  };

  if (isLoading)
    return (
      <div className="min-w-0">
        <div className="p-12 text-center" role="status">
          <p className="text-xs text-muted">Loading transaction details…</p>
        </div>
      </div>
    );

  if (error || !transaction)
    return (
      <div className="min-w-0">
        <div className="p-12 text-center">
          <h3 className="mb-1.5 text-[15px] font-mediumish">Transaction Not Found</h3>
          <p className="mb-4 text-xs text-muted">
            {!hasValidReference
              ? "This transaction does not have a valid reference."
              : (error as any)?.message || "The requested transaction could not be found."}
          </p>
          <button onClick={() => navigate(-1)} className={primaryBtn}>
            Go Back
          </button>
        </div>
      </div>
    );

  const formatLabel = (value: unknown) =>
    value
      ? String(value)
          .replace(/[_-]+/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "N/A";

  const date = transactionDate ? new Date(transactionDate) : null;
  const formattedDate =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  return (
    <div ref={receiptRef} className="transaction-receipt mx-auto w-full max-w-[820px] min-w-0">
      <div className="receipt-actions mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className={secondaryBtn} aria-label="Go back"><FaArrowLeft /></button>
        <h1 className="text-[22px] font-mediumish tracking-[-0.5px] nav:text-[28px]">Transaction details</h1>
      </div>
      <article className="overflow-hidden rounded-lg border border-line bg-paper">
        <header className="border-b border-line bg-tint px-5 py-7 sm:px-7">
          <p className="text-sm font-medium text-muted">{formatLabel(transaction.product_name || transaction.type)}</p>
          <p className="mb-3 mt-2 break-words text-4xl font-semibold tracking-tight">{formatNairaAmount(transaction.debitKobo != null ? transaction.debitKobo / 100 : transaction.amount)}</p>
          <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: statusColor(transaction.status) }}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{formatLabel(transaction.status)}</span>
          <p className="mt-2 text-xs text-muted">{transaction.debitKobo != null ? 'Wallet debit' : 'Transaction amount'}</p>
        </header>
        <div className="px-5 py-3 sm:px-7">
          <h2 className="sr-only">Receipt details</h2>
          <DetailRow label="Date & time" value={formattedDate} />
          <DetailRow label="Service" value={formatLabel(transaction.type)} />
          {transaction.phone && <DetailRow label="Recipient" value={transaction.phone} />}
          {transaction.paymentMethod && <DetailRow label="Payment method" value={formatLabel(transaction.paymentMethod)} />}
          {transaction.bankName && <DetailRow label="Bank" value={transaction.bankName} />}
          {transaction.accountNumber && <DetailRow label="Account" value={`****${transaction.accountNumber.slice(-4)}`} />}
          {transaction.transactionType === 'utility' && <>
            {transaction.network && <DetailRow label="Network" value={transaction.network.toUpperCase()} />}
            {transaction.dataPlan && <DetailRow label="Data plan" value={transaction.dataPlan} />}
            {transaction.validity && <DetailRow label="Validity" value={transaction.validity} />}
            {transaction.subscription_type && <DetailRow label="Subscription" value={formatLabel(transaction.subscription_type)} />}
            {transaction.token != null && <DetailRow label="Electricity token" value={transaction.token} />}
            {transaction.units != null && <DetailRow label="Electricity units" value={transaction.units} />}
          </>}
          <div className="border-t border-line py-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-xs text-muted">Payment reference</h3>
              {reference && <button type="button" onClick={copyReference} className="receipt-actions inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-xs font-semibold text-accent hover:bg-tint">{copyMessage === 'Reference copied' ? <FaCheck /> : <FaCopy />}Copy</button>}
            </div>
            <p className="select-all break-words font-mono text-xs leading-relaxed [overflow-wrap:anywhere]">{reference || 'Unavailable'}</p>
            <p role="status" className="receipt-actions mt-2 text-xs text-muted">{copyMessage}</p>
          </div>
          {(transactionId || transaction.serviceID) && <details className="receipt-secondary border-t border-line py-3">
            <summary className="min-h-11 cursor-pointer py-3 text-xs font-medium text-muted">Technical details</summary>
            {transactionId && <DetailRow label="Transaction ID" value={transactionId} />}
            {transaction.serviceID && <DetailRow label="Service ID" value={transaction.serviceID} />}
          </details>}
        </div>
      </article>
      <div className="receipt-actions mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={printReceipt} className={secondaryBtn}><FaPrint />Print / save PDF</button>
        <Link to="/support" className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-accent hover:underline">Need help with this payment?</Link>
      </div>
    </div>
  );
};

export default TransactionDetail;
