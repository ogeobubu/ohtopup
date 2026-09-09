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

  const statusColor = (s) => {
    if (s === 'delivered' || s === 'completed') return '#27805d';
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

  const DetailRow = ({ label, value, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--ot-line)' }}>
      <span style={{ fontSize: 12, color: 'var(--ot-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color || 'var(--ot-ink)', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );

  return (
    <div className="ot-dashboard">
      <div className="ot-dashboard-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} className="ot-button ot-button-secondary" style={{ padding: '8px 12px', minHeight: 'auto' }}><FaArrowLeft /></button>
          <div>
            <h1>Transaction Details</h1>
            <p style={{ fontSize: 12, color: 'var(--ot-muted)', fontFamily: 'monospace' }}>ID: {transaction.requestId}</p>
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
        <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <DetailRow label="Transaction ID" value={transaction.requestId} />
            <DetailRow label={transaction.debitKobo != null ? "Wallet debit" : "Amount"} value={formatNairaAmount(transaction.debitKobo != null ? transaction.debitKobo / 100 : transaction.amount)} color="#27805d" />
            <DetailRow label="Date & Time" value={new Date(transaction.transactionDate).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
          </div>
          <div>
            <DetailRow label="Service Type" value={transaction.type} />
            <DetailRow label="Product Name" value={transaction.product_name} />
            {transaction.phone && <DetailRow label="Phone Number" value={transaction.phone} />}
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="ot-panel" style={{ marginBottom: 16 }}>
        <div className="ot-panel-heading"><div><h2>Additional Details</h2></div></div>
        <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <p className="ot-field-label">User Information</p>
            <DetailRow label="Name" value={`${transaction.user?.firstName} ${transaction.user?.lastName}`} />
            <DetailRow label="Email" value={transaction.user?.email} />
            <DetailRow label="Phone" value={transaction.user?.phoneNumber} />
          </div>
          <div>
            <p className="ot-field-label">Transaction Details</p>
            <DetailRow label="Service ID" value={transaction.serviceID || 'N/A'} />
            <DetailRow label="Service value" value={formatNairaAmount(transaction.amount)} color="#27805d" />
            <DetailRow label="Customer discount" value={formatNairaAmount(transaction.discount || 0)} color="var(--ot-accent)" />
          </div>
        </div>
      </div>

      {/* Service-Specific Details */}
      {transaction.transactionType === 'utility' && (
        <div className="ot-panel" style={{ marginBottom: 16 }}>
          <div className="ot-panel-heading"><div><h2>Service Details</h2></div></div>
          <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              {transaction.provider && <DetailRow label="Provider" value={transaction.provider} />}
              {transaction.network && <DetailRow label="Network" value={transaction.network.toUpperCase()} />}
              {transaction.dataPlan && <DetailRow label="Data Plan" value={transaction.dataPlan} />}
              {transaction.dataAmount && <DetailRow label="Data Amount" value={transaction.dataAmount} />}
            </div>
            <div>
              {transaction.validity && <DetailRow label="Validity" value={transaction.validity} />}
              {transaction.token && <DetailRow label="Electricity Token" value={transaction.token} />}
              {transaction.units && <DetailRow label="Electricity Units" value={transaction.units} color="var(--ot-accent)" />}
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
