import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import { getTransactionDetails } from "../api";
import { formatNairaAmount } from "../utils";

const TransactionDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: transactionData, isLoading, error } = useQuery({
    queryKey: ['transaction-detail', requestId],
    queryFn: () => getTransactionDetails(requestId),
    enabled: !!requestId,
  });

  const transaction = transactionData?.transaction;
  const reference = transaction?.reference || transaction?.requestId;
  const transactionId = transaction?.id || transaction?._id;
  const transactionDate = transaction?.createdAt || transaction?.transactionDate;

  const statusColor = (s: string) => {
    if (s === 'delivered' || s === 'completed' || s === 'successful') return '#27805d';
    if (s === 'pending') return '#9a6818';
    if (s === 'failed') return '#b84545';
    return 'var(--ot-muted)';
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try { alert('PDF generation will be implemented soon!'); } finally { setIsGeneratingPDF(false); }
  };

  if (isLoading) return <div className="ot-dashboard"><div className="ot-empty" role="status"><p>Loading transaction details…</p></div></div>;

  if (error || !transaction) return (
    <div className="ot-dashboard">
      <div className="ot-empty">
        <h3>Transaction Not Found</h3>
        <p>{error?.message || "The requested transaction could not be found."}</p>
        <button onClick={() => navigate(-1)} className="ot-button ot-button-primary" style={{ marginTop: 12 }}>Go Back</button>
      </div>
    </div>
  );

  const DetailRow = ({ label, value, color }: { label: string; value: unknown; color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--ot-line)' }}>
      <span style={{ fontSize: 12, color: 'var(--ot-muted)' }}>{label}</span>
      <span title={String(value ?? 'N/A')} style={{ fontSize: 13, fontWeight: 500, color: color || 'var(--ot-ink)', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(value ?? 'N/A')}</span>
    </div>
  );

  const formatLabel = (value: unknown) => value
    ? String(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'N/A';

  const date = transactionDate ? new Date(transactionDate) : null;
  const formattedDate = date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <div className="ot-dashboard">
      <div className="ot-dashboard-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} className="ot-button ot-button-secondary" style={{ padding: '8px 12px', minHeight: 'auto' }}><FaArrowLeft /></button>
          <div>
            <h1>Transaction Details</h1>
            <p style={{ fontSize: 12, color: 'var(--ot-muted)', fontFamily: 'monospace', overflowWrap: 'anywhere' }}>Reference: {reference || 'N/A'}</p>
          </div>
        </div>
        <button onClick={generatePDF} disabled={isGeneratingPDF} className="ot-button ot-button-secondary" style={{ fontSize: 12 }}><FaDownload /> {isGeneratingPDF ? 'Generating…' : 'Download PDF'}</button>
      </div>

      {/* Status */}
      <div className="ot-panel" style={{ marginBottom: 16 }}>
        <div className="ot-panel-heading">
          <div><h2>Transaction Status</h2></div>
          <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(transaction.status), textTransform: 'uppercase' }}>{transaction.status}</span>
        </div>
        <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          <div>
            <DetailRow label="Reference" value={reference} />
            {transactionId && <DetailRow label="Transaction ID" value={transactionId} />}
            <DetailRow label={transaction.debitKobo != null ? "Wallet debit" : "Amount"} value={formatNairaAmount(transaction.debitKobo != null ? transaction.debitKobo / 100 : transaction.amount)} color="#27805d" />
            <DetailRow label="Date & Time" value={formattedDate} />
          </div>
          <div>
            <DetailRow label="Service Type" value={formatLabel(transaction.type)} />
            <DetailRow label="Product Name" value={formatLabel(transaction.product_name)} />
            {transaction.phone && <DetailRow label="Phone Number" value={transaction.phone} />}
          </div>
        </div>
      </div>

      {/* Service-Specific Details */}
      {transaction.transactionType === 'utility' && (
        <div className="ot-panel" style={{ marginBottom: 16 }}>
          <div className="ot-panel-heading"><div><h2>Service Details</h2></div></div>
          <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            <div>
              <DetailRow label="Service ID" value={transaction.serviceID} />
              {transaction.network && <DetailRow label="Network" value={transaction.network.toUpperCase()} />}
              {transaction.dataPlan && <DetailRow label="Data Plan" value={transaction.dataPlan} />}
              {transaction.provider && <DetailRow label="Provider" value={formatLabel(transaction.provider)} />}
            </div>
            <div>
              {transaction.validity && <DetailRow label="Validity" value={transaction.validity} />}
              {transaction.subscription_type && <DetailRow label="Subscription Type" value={formatLabel(transaction.subscription_type)} />}
              {transaction.token != null && <DetailRow label="Electricity Token" value={transaction.token} />}
              {transaction.units != null && <DetailRow label="Electricity Units" value={transaction.units} color="var(--ot-accent)" />}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Transaction Details */}
      {transaction.transactionType === 'wallet' && (
        <div className="ot-panel">
          <div className="ot-panel-heading"><div><h2>Payment Details</h2></div></div>
          <div style={{ padding: '0 24px 24px' }}>
            {transaction.paymentMethod && <DetailRow label="Payment Method" value={transaction.paymentMethod.replace('_', ' ')} />}
            {transaction.bankName && <DetailRow label="Bank" value={transaction.bankName} />}
            {transaction.accountNumber && <DetailRow label="Account" value={`****${transaction.accountNumber.slice(-4)}`} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetail;
