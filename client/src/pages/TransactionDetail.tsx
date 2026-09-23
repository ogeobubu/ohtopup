import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import { getTransactionDetails } from "../api";
import { formatNairaAmount } from "../utils";

const secondaryBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-[15px] py-[11px] text-[13px] font-semibold text-ink transition hover:bg-tint disabled:opacity-45";
const primaryBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark";

function DetailRow({ label, value, color }: { label: string; value: unknown; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span
        title={String(value ?? "N/A")}
        className="min-w-0 max-w-[60%] overflow-hidden text-ellipsis whitespace-nowrap text-right text-[13px] font-medium"
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      alert("PDF generation will be implemented soon!");
    } finally {
      setIsGeneratingPDF(false);
    }
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
    <div className="min-w-0">
      <div className="mb-[30px] flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`${secondaryBtn} min-h-auto px-3 py-2`}
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>
          <div className="min-w-0">
            <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">
              Transaction Details
            </h1>
            <p className="overflow-wrap-anywhere font-mono text-xs text-muted">
              Reference: {reference || "N/A"}
            </p>
          </div>
        </div>
        <button onClick={generatePDF} disabled={isGeneratingPDF} className={`${secondaryBtn} text-xs`}>
          <FaDownload /> {isGeneratingPDF ? "Generating…" : "Download PDF"}
        </button>
      </div>

      <div className="mb-4 overflow-hidden rounded-lg border border-line bg-paper">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]">
          <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Transaction Status</h2>
          <span
            className="text-xs font-semibold uppercase"
            style={{ color: statusColor(transaction.status) }}
          >
            {transaction.status}
          </span>
        </div>
        <div className="grid gap-6 px-6 pb-6 sm:grid-cols-2">
          <div>
            <DetailRow label="Reference" value={reference} />
            {transactionId && <DetailRow label="Transaction ID" value={transactionId} />}
            <DetailRow
              label={transaction.debitKobo != null ? "Wallet debit" : "Amount"}
              value={formatNairaAmount(transaction.debitKobo != null ? transaction.debitKobo / 100 : transaction.amount)}
              color="#27805d"
            />
            <DetailRow label="Date & Time" value={formattedDate} />
          </div>
          <div>
            <DetailRow label="Service Type" value={formatLabel(transaction.type)} />
            <DetailRow label="Product Name" value={formatLabel(transaction.product_name)} />
            {transaction.phone && <DetailRow label="Phone Number" value={transaction.phone} />}
          </div>
        </div>
      </div>

      {transaction.transactionType === "utility" && (
        <div className="mb-4 overflow-hidden rounded-lg border border-line bg-paper">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Service Details</h2>
          </div>
          <div className="grid gap-6 px-6 pb-6 sm:grid-cols-2">
            <div>
              <DetailRow label="Service ID" value={transaction.serviceID} />
              {transaction.network && <DetailRow label="Network" value={transaction.network.toUpperCase()} />}
              {transaction.dataPlan && <DetailRow label="Data Plan" value={transaction.dataPlan} />}
              {transaction.provider && <DetailRow label="Provider" value={formatLabel(transaction.provider)} />}
            </div>
            <div>
              {transaction.validity && <DetailRow label="Validity" value={transaction.validity} />}
              {transaction.subscription_type && (
                <DetailRow label="Subscription Type" value={formatLabel(transaction.subscription_type)} />
              )}
              {transaction.token != null && <DetailRow label="Electricity Token" value={transaction.token} />}
              {transaction.units != null && (
                <DetailRow label="Electricity Units" value={transaction.units} color="var(--ot-accent)" />
              )}
            </div>
          </div>
        </div>
      )}

      {transaction.transactionType === "wallet" && (
        <div className="overflow-hidden rounded-lg border border-line bg-paper">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Payment Details</h2>
          </div>
          <div className="px-6 pb-6">
            {transaction.paymentMethod && (
              <DetailRow label="Payment Method" value={transaction.paymentMethod.replace("_", " ")} />
            )}
            {transaction.bankName && <DetailRow label="Bank" value={transaction.bankName} />}
            {transaction.accountNumber && (
              <DetailRow label="Account" value={`****${transaction.accountNumber.slice(-4)}`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetail;
