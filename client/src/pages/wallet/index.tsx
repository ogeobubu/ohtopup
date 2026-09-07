import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaBuilding, FaCopy, FaPlus, FaMinus, FaUniversity } from "react-icons/fa";
import { FiEye, FiEyeOff, FiPlus, FiArrowRight, FiHelpCircle, FiArrowUpRight, FiArrowDownLeft } from "react-icons/fi";
import DataTable from "../../components/dataTable";
import ModernPagination from "../../components/modernPagination";
import Button from "../../components/ui/forms/button";
import {
  getWallet,
  getTransactions,
  getBanks,
  updateUser,
  getUser,
  initiatePaystackDeposit,
  verifyPaystackDeposit,
  verifyBankAccount,
  getRates,
  getWalletSettings,
} from "../../api";
import Modal from "../../admin/components/modal";
import { toast } from "react-toastify";
import Chip from "../../components/ui/chip";
import TextField from "../../components/ui/forms/input";
import Select from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import Banks from "./banks";
import Withdraw from "./withdraw";
import Gift from "./gift";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatNairaAmount } from "../../utils";

// TypeScript interfaces
interface BankOption {
  value: string;
  label: string;
  code: string;
}

interface Transaction {
  reference: string;
  amount: number;
  status: string;
  timestamp: string;
  product_name?: string;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
}

interface WalletData {
  balance: number;
}

interface User {
  _id: string;
  email: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    bankCode: string;
    accountName: string;
  };
}

interface Rates {
  depositRate: number;
}

const Wallet = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode);

  const [hidden, setHidden] = useState(false);
  const [selectedCard, setSelectedCard] = useState("Naira Wallet");
  const [activeTab, setActiveTab] = useState("deposit");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [banks, setBanks] = useState([]);
  const [showBanks, setShowBanks] = useState(false);
  const [amount, setAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [reference, setReference] = useState("");
  // New state to manage deposit option
  const [depositOption, setDepositOption] = useState(null);
  // State for withdrawal transaction details modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  // Wallet settings state
  const [walletSettings, setWalletSettings] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Account number copied!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast.error("Failed to copy account number.");
      });
  };

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedBank(null);
  };

  const closeModal = () => setIsModalOpen(false);

  const openDepositModal = () => {
    setIsDepositModalOpen(true);
    setDepositOption(null); // Reset deposit option when opening the modal
  };

  const closeDepositModal = () => {
    setIsDepositModalOpen(false);
    setDepositOption(null); // Reset deposit option when closing the modal
  };

  const closeWithdrawModal = () => setIsWithdrawModalOpen(false);

  const handleSearchChange = (e) => {
    setReference(e.target.value);
    setCurrentPage(1);
  };

  const { data: rates, refetch: refetchRates } = useQuery({
    queryKey: ["rates"],
    queryFn: getRates,
  });

  const {
    data: walletData,
    error: walletError,
    isLoading: walletLoading,
  } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });

  const {
    data: transactionsData,
    error: transactionsError,
    isLoading: transactionsLoading,
  } = useQuery({
    queryKey: ["transactions", activeTab, currentPage, limit, reference],
    queryFn: () =>
      getTransactions(activeTab.toLowerCase(), currentPage, limit, reference),
    enabled: selectedCard === "Naira Wallet",
  });

  const { data: bankData, error: bankError } = useQuery({
    queryKey: ["banks"],
    queryFn: getBanks,
    enabled: isModalOpen,
  });

  const { data: user, error: userError } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  useEffect(() => {
    if (!user?._id) return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) return;
    verifyPaystackDeposit(reference, user._id).then(result => {
      if (result.status === 'completed') toast.success('Payment verified. Your wallet has been credited.');
      else toast.info('Payment has not completed yet. Check your transaction history.');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      window.history.replaceState({}, document.title, window.location.pathname);
    }).catch(error => toast.error(error.message || 'Unable to verify payment.'));
  }, [user?._id, queryClient]);

  const { data: walletSettingsData, error: walletSettingsError } = useQuery({
    queryKey: ["walletSettings"],
    queryFn: getWalletSettings,
    enabled: selectedCard === "Naira Wallet", // Only fetch when on wallet tab
  });

  // Update wallet settings state when data is fetched
  useEffect(() => {
    if (walletSettingsData) {
      setWalletSettings(walletSettingsData);
    }
  }, [walletSettingsData]);

  const [checkoutQuote, setCheckoutQuote] = useState(null);

  useEffect(() => {
    if (bankData) {
      const formattedBanks = bankData.data.map((bank) => ({
        value: bank.id,
        label: bank.name,
        code: bank.code,
      }));
      setBanks(formattedBanks);
    }
  }, [bankData]);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
    setTotalAmount(Number(value) || 0);
    setCheckoutQuote(null);
  };

  const formattedAmount = amount ? amount.toString() : "";

  const handleCheckout = async () => {
    if (checkoutQuote) {
      window.location.assign(checkoutQuote.url);
      return;
    }
    setLoading(true);
    try {
      const quote = await initiatePaystackDeposit({ amount: Number(amount) });
      setCheckoutQuote(quote);
    } catch (error) {
      toast.error(error.message || 'Unable to initialize payment.');
    } finally { setLoading(false); }
  };

  const handleShowBanks = () => {
    setShowBanks(!showBanks);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const validationSchema = Yup.object().shape({
    accountNumber: Yup.string()
      .required("Account number is required")
      .matches(/^\d{10}$/, "Account number must be 10 digits"),
  });

  const handleAccountNumberChange = async (e) => {
    const value = e.target.value;
    formik.setFieldValue("accountNumber", value);

    if (value.length === 10) {
      setIsVerifying(true);
      const response = await verifyBankAccount({
        accountNumber: value,
        bankCode: selectedBank?.code,
      });
      console.log(response.data)
      setIsVerifying(false);
      setAccountName(response.data.account_name);
    }
  };

  const formik = useFormik({
    initialValues: { accountNumber: "" },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await updateUser({
          bankAccount: {
            bankName: selectedBank?.label,
            accountNumber: values.accountNumber,
            bankCode: selectedBank?.code,
            accountName,
          },
        });
        toast.success(`Bank ${selectedBank?.label} added successfully!`);
        resetForm();
        closeModal();
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } catch (error) {
        toast.error("Error adding bank account: " + error.message);
      }
    },
  });

  const columns = [
    {
      header: "Reference",
      render: (row) => (
        <div className="flex items-center space-x-2">
          <p
            title={row.reference}
            className="w-full whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {row.reference && row.reference.length > 10
              ? `${row.reference.slice(0, 15)}...`
              : row.reference}
          </p>
          <button
            onClick={() => {
              setSelectedTransaction(row);
              setIsTransactionModalOpen(true);
            }}
            className="text-blue-500 hover:text-blue-700 text-xs underline"
            title="View Details"
          >
            View
          </button>
        </div>
      ),
    },
    {
      header: "Bank",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.bankName}</span>
          <span className="text-gray-400 text-sm">{row.accountNumber}</span>
        </div>
      ),
    },
    {
      header: "Amount",
      render: (row) => <p>{formatNairaAmount(row.amount)}</p>,
    },
    { header: "Status", render: (row) => <Chip status={row.status} /> },
    {
      header: "Date",
      render: (row) => (
        <small>{new Date(row.timestamp).toLocaleString()}</small>
      ),
    },
  ];

  const topupColumns = [
    {
      header: "Reference",
      render: (row) => (
        <p
          title={row.reference}
          className="w-full whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {row.reference && row.reference.length > 10
            ? `${row.reference.slice(0, 15)}...`
            : row.reference}
        </p>
      ),
    },
    {
      header: "Amount",
      render: (row) => <p>{formatNairaAmount(row.amount)}</p>,
    },
    { header: "Status", render: (row) => <Chip status={row.status} /> },
    {
      header: "Date",
      render: (row) => (
        <small>{new Date(row.timestamp).toLocaleString()}</small>
      ),
    },
  ];

  return (
    <div className="ot-dashboard">
      <div className="ot-dashboard-heading"><div><h1>My Wallet</h1><p>Manage your funds, view transactions, and handle payments</p></div><span className="ot-date">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>

      <nav className="ot-utility-tabs" aria-label="Wallet type">
        <button aria-pressed={selectedCard === "Naira Wallet"} onClick={() => { setSelectedCard("Naira Wallet"); setShowBanks(false); }}><FaBuilding />Naira Wallet</button>
        <button aria-pressed={selectedCard === "Gift Points"} onClick={() => setSelectedCard("Gift Points")}><FaCopy />Gift Points</button>
      </nav>

      {selectedCard === "Naira Wallet" && (
        showBanks ? (
          <Banks user={user} handleShowBanks={handleShowBanks} openModal={openModal} />
        ) : (
          <>
            <div className="ot-overview">
              <section className="ot-balance" aria-label="Wallet balance">
                <div className="ot-balance-label">Available balance<button onClick={() => setHidden(!hidden)} aria-label={hidden ? 'Show balance' : 'Hide balance'}>{hidden ? <FiEyeOff /> : <FiEye />}</button></div>
                <div className="ot-balance-amount">{walletData ? (hidden ? '••••••' : formatNairaAmount(walletData.balance ?? 0)) : '—'}</div>
                {walletError ? <button className="ot-button ot-button-light" onClick={() => window.location.reload()}>Try again</button> : <button className="ot-button ot-button-light" onClick={openDepositModal}><FiPlus />Add Funds</button>}
              </section>
              <section className="ot-panel">
                <div className="ot-panel-heading"><div><h2>Quick actions</h2><p>Manage your accounts and rewards.</p></div></div>
                <div className="ot-wallet-actions">
                  <button className="ot-shortcut" onClick={() => setIsWithdrawModalOpen(true)}><FiArrowUpRight /><span>Withdraw</span></button>
                  <button className="ot-shortcut" onClick={handleShowBanks}><FaBuilding /><span>Bank Account</span></button>
                </div>
              </section>
            </div>

            <section className="ot-panel" aria-label="Transactions">
              <div className="ot-panel-heading"><div><h2>Transactions</h2><p>Your recent payments and withdrawals.</p></div></div>
              <div className="ot-utility-tabs" style={{ borderBottom: 'none', margin: '0 24px', paddingTop: 0 }}>
                <button aria-pressed={activeTab === "deposit"} onClick={() => handleTabClick("deposit")}>Topup</button>
                <button aria-pressed={activeTab === "withdrawal"} onClick={() => handleTabClick("withdrawal")}>Withdrawal</button>
              </div>
              {transactionsLoading ? <div className="ot-empty" role="status"><p>Loading your transactions…</p></div> : transactionsError ? <div className="ot-empty"><h3>We couldn't load your transactions.</h3><p>{transactionsError.message}</p><button className="ot-button ot-button-secondary" onClick={() => window.location.reload()}>Try again</button></div> : <>
                <div style={{ padding: '0 24px 16px' }}><input type="text" placeholder="Search by Reference..." value={reference} onChange={handleSearchChange} className="ot-field" style={{ maxWidth: 320 }} /></div>
                <DataTable columns={activeTab === "withdrawal" ? columns : topupColumns} data={transactionsData?.transactions} emptyMessage="No transactions found" />
                <div style={{ padding: '16px 24px' }}><ModernPagination currentPage={currentPage} totalPages={transactionsData?.totalPages} onPageChange={setCurrentPage} /></div>
              </>}
            </section>

            {walletSettingsData && (
              <section className="ot-panel" aria-label="Wallet settings">
                <div className="ot-panel-heading"><div><h2>Wallet Settings</h2><p>Current limits and fees.</p></div></div>
                <div className="ot-wallet-settings">
                  {walletSettingsData.maintenanceMode && <div className="ot-field-error mb-3">⚠ {walletSettingsData.maintenanceMessage || "Wallet services are temporarily unavailable"}</div>}
                  <div className="ot-wallet-settings-grid">
                    <div><p className="ot-field-label">Min Deposit</p><p>₦{(walletSettingsData.minDepositAmount || 100).toLocaleString()}</p></div>
                    <div><p className="ot-field-label">Max Deposit</p><p>₦{(walletSettingsData.maxDepositAmount || 1000000).toLocaleString()}</p></div>
                    <div><p className="ot-field-label">Min Withdrawal</p><p>₦{(walletSettingsData.minWithdrawalAmount || 100).toLocaleString()}</p></div>
                    <div><p className="ot-field-label">Paystack Fee</p><p>{walletSettingsData.paystackFee?.percentage || 1.5}% + ₦{(walletSettingsData.paystackFee?.fixedFee || 100).toLocaleString()}</p></div>
                  </div>
                </div>
              </section>
            )}

            {walletSettingsData && walletData?.balance < (walletSettingsData.lowBalanceThreshold || 1000) && (
              <div className="ot-panel" style={{ padding: '18px 24px', borderLeft: '4px solid #9a6818' }}>
                <p><strong>Low Balance Alert</strong> — Your wallet balance is below ₦{(walletSettingsData.lowBalanceThreshold || 1000).toLocaleString()}. Consider adding funds.</p>
              </div>
            )}
          </>
        )
      )}

      {selectedCard === "Gift Points" && <Gift user={user} isDarkMode={isDarkMode} />}

      <Modal isOpen={isModalOpen} closeModal={closeModal} title="Add Bank Account">
        <form onSubmit={formik.handleSubmit}>
          <label className="ot-field-label">Select a Bank</label>
          {bankError && <p className="ot-field-error">{bankError.message}</p>}
          <Select options={banks} value={selectedBank} onChange={setSelectedBank} isSearchable placeholder="Select a bank..." className="mb-4" />
          <TextField name="accountNumber" label="Bank Account Number" placeholder="Enter account number" value={formik.values.accountNumber} onChange={handleAccountNumberChange} onBlur={formik.handleBlur} error={formik.touched.accountNumber && formik.errors.accountNumber} type="text" isDarkMode={isDarkMode} />
          {formik.touched.accountNumber && formik.errors.accountNumber && <div className="ot-field-error mb-3">{formik.errors.accountNumber}</div>}
          <TextField name="accountName" label="Bank Account Name" placeholder="Enter account name" value={accountName} disabled onBlur={formik.handleBlur} type="text" isDarkMode={isDarkMode} />
          <Button type="submit" disabled={!selectedBank}>Add Bank Account</Button>
        </form>
      </Modal>

      <Modal isOpen={isDepositModalOpen} closeModal={closeDepositModal} title="Add Funds to Wallet" isDarkMode={isDarkMode}>
        <div className="space-y-4">
          {!depositOption ? (
            <>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-1">Choose Deposit Method</h3>
                <p className="text-sm" style={{ color: 'var(--ot-muted)' }}>Select how you'd like to add funds to your wallet</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => setDepositOption("automated")} className="ot-shortcut" style={{ minHeight: 80, padding: '16px 20px', justifyContent: 'flex-start', flexDirection: 'row', gap: 14 }}>
                  <FiPlus /><span style={{ fontWeight: 600 }}>Automated Deposit</span><span style={{ fontSize: 12, color: 'var(--ot-muted)', marginLeft: 'auto' }}>→</span>
                </button>
                <button disabled className="ot-shortcut" style={{ minHeight: 80, padding: '16px 20px', justifyContent: 'flex-start', flexDirection: 'row', gap: 14, opacity: 0.5 }}>
                  <FaUniversity /><span style={{ fontWeight: 600 }}>Manual Deposit</span><span style={{ fontSize: 12, color: 'var(--ot-muted)', marginLeft: 'auto' }}>Coming Soon</span>
                </button>
              </div>
            </>
          ) : depositOption === "automated" ? (
            <>
              <h3 className="text-lg font-semibold mb-1 text-center">Enter Deposit Amount</h3>
              <div className="space-y-3">
                <TextField name="amount" label="Deposit Amount (₦)" placeholder={`Min ₦${walletSettingsData?.minDepositAmount || 100}`} value={formattedAmount} onChange={handleAmountChange} type="text" isDarkMode={isDarkMode} error={false} onBlur={() => {}} />
                {amount > 0 && <div className="ot-panel" style={{ padding: 16 }}>
                  <div className="flex justify-between text-sm mb-1"><span style={{ color: 'var(--ot-muted)' }}>Deposit Amount:</span><span className="font-medium">{formatNairaAmount(amount)}</span></div>
                  <div className="flex justify-between text-sm mb-1"><span style={{ color: 'var(--ot-muted)' }}>Processing Fee:</span><span className="font-medium">{checkoutQuote ? formatNairaAmount(checkoutQuote.processingFee) : 'Shown before payment'}</span></div>
                  <div className="flex justify-between text-sm font-semibold" style={{ borderTop: '1px solid var(--ot-line)', paddingTop: 8, marginTop: 8 }}><span>Total:</span><span>{formatNairaAmount(totalAmount)}</span></div>
                </div>}
                {checkoutQuote && <p className="text-sm">Your wallet will receive {formatNairaAmount(checkoutQuote.creditedAmount)} after fees.</p>}
                <p className="text-xs" style={{ color: 'var(--ot-muted)' }}>Minimum deposit is ₦{(walletSettingsData?.minDepositAmount || 100).toLocaleString()}</p>
                <button type="button" onClick={handleCheckout} disabled={loading || Number(amount) < (walletSettingsData?.minDepositAmount || 100)} className="ot-button ot-button-primary w-full">
                  {loading ? 'Preparing…' : checkoutQuote ? 'Pay now' : 'Review payment'}
                </button>
              </div>
            </>
          ) : null}
          {depositOption && <div className="flex justify-center pt-2"><button onClick={() => setDepositOption(null)} className="ot-text-link" style={{ fontSize: 13 }}>← Back to Options</button></div>}
        </div>
      </Modal>

      <Modal isOpen={isWithdrawModalOpen} closeModal={closeWithdrawModal} title="Withdraw Funds" isDarkMode={isDarkMode}>
        <Withdraw handleShowBanks={handleShowBanks} closeModal={closeWithdrawModal} walletData={walletData} user={user} isDarkMode={isDarkMode} rates={rates} formatNairaAmount={formatNairaAmount} walletSettings={walletSettings} />
      </Modal>

      <Modal isOpen={isTransactionModalOpen} closeModal={() => { setIsTransactionModalOpen(false); setSelectedTransaction(null); }} title="Transaction Details" isDarkMode={isDarkMode}>
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="font-semibold text-sm">{selectedTransaction.reference}</p><p className="text-xs" style={{ color: 'var(--ot-muted)' }}>{new Date(selectedTransaction.timestamp).toLocaleString()}</p></div>
              <Chip status={selectedTransaction.status} />
            </div>
            <div className="flex justify-between text-sm" style={{ borderTop: '1px solid var(--ot-line)', paddingTop: 12 }}><span style={{ color: 'var(--ot-muted)' }}>Amount</span><span className="font-semibold">{formatNairaAmount(selectedTransaction.amount)}</span></div>
            {selectedTransaction.bankName && <div className="flex justify-between text-sm"><span style={{ color: 'var(--ot-muted)' }}>Bank</span><span>{selectedTransaction.bankName} · {selectedTransaction.accountNumber || 'N/A'}</span></div>}
            {selectedTransaction.feeAmount > 0 && <div className="flex justify-between text-sm"><span style={{ color: 'var(--ot-muted)' }}>Fee</span><span>₦{selectedTransaction.feeAmount?.toLocaleString() || '0'} ({selectedTransaction.feeDeductionMethod === 'fromWallet' ? 'from wallet' : 'from withdrawal'})</span></div>}
            {(selectedTransaction.status === 'rejected' || selectedTransaction.status === 'failed') && <div className="ot-panel" style={{ padding: 12, borderLeft: '3px solid #b84545' }}><p className="text-sm"><strong>{selectedTransaction.status === 'rejected' ? 'Rejection' : 'Failure'}:</strong> {selectedTransaction.rejectionReason || selectedTransaction.failureReason || 'No specific reason provided.'}</p></div>}
            <div className="flex justify-end"><button onClick={() => { setIsTransactionModalOpen(false); setSelectedTransaction(null); }} className="ot-button ot-button-secondary">Close</button></div>
          </div>
        )}
      </Modal>

      <div className="ot-dashboard-help"><span><FiHelpCircle />Need help with a payment?</span><Link className="ot-text-link" to="/support">Contact support <FiArrowUpRight /></Link></div>
    </div>
  );
};

export default Wallet;
