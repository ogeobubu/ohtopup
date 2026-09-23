import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaBuilding, FaCopy } from "react-icons/fa";
import { FiEye, FiEyeOff, FiPlus, FiHelpCircle, FiArrowUpRight } from "react-icons/fi";
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
  getWalletSettings,
} from "../../api";
import Modal from "../../admin/components/modal";
import { toast } from "react-toastify";
import TextField from "../../components/ui/forms/input";
import Select from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import Banks from "./banks";
import Gift from "./gift";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatNairaAmount } from "../../utils";

const primaryBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark";
const secondaryBtn =
  "inline-flex min-h-[38px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink transition hover:bg-tint disabled:opacity-45 disabled:cursor-not-allowed";
const lightBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-white px-[15px] py-[11px] text-[13px] font-semibold text-[#18232d] transition hover:bg-[#e9edfa]";
const textLink =
  "inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-accent hover:underline hover:underline-offset-4";
const panel = "overflow-hidden rounded-lg border border-line bg-paper";
const panelHeading = "flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]";
const th = "px-6 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.5px] text-muted";
const td = "px-6 py-3";
const tabBtn = (active: boolean) =>
  [
    "-mb-px flex min-h-11 items-center gap-2 border-b-2 pb-3 text-xs font-mediumish transition-colors",
    active ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
  ].join(" ");

const Wallet = () => {
  const queryClient = useQueryClient();
  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode);

  const [hidden, setHidden] = useState(false);
  const [selectedCard, setSelectedCard] = useState("Naira Wallet");
  const [activeTab] = useState("deposit");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [showBanks, setShowBanks] = useState(false);
  const [amount, setAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [reference, setReference] = useState("");
  const [depositOption, setDepositOption] = useState<string | null>(null);
  const [checkoutQuote, setCheckoutQuote] = useState<any>(null);

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedBank(null);
  };
  const closeModal = () => setIsModalOpen(false);
  const openDepositModal = () => {
    setIsDepositModalOpen(true);
    setDepositOption(null);
  };
  const closeDepositModal = () => {
    setIsDepositModalOpen(false);
    setDepositOption(null);
  };
  const handleSearchChange = (e: any) => {
    setReference(e.target.value);
    setCurrentPage(1);
  };

  const { data: walletData, error: walletError } = useQuery({ queryKey: ["wallet"], queryFn: getWallet });
  const {
    data: transactionsData,
    error: transactionsError,
    isLoading: transactionsLoading,
  } = useQuery({
    queryKey: ["transactions", activeTab, currentPage, limit, reference],
    queryFn: () => getTransactions(activeTab.toLowerCase(), currentPage, limit, reference),
    enabled: selectedCard === "Naira Wallet",
  });
  const { data: bankData, error: bankError } = useQuery({
    queryKey: ["banks"],
    queryFn: getBanks,
    enabled: isModalOpen,
  });
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getUser });
  const { data: walletSettingsData } = useQuery({
    queryKey: ["walletSettings"],
    queryFn: getWalletSettings,
    enabled: selectedCard === "Naira Wallet",
  });

  useEffect(() => {
    if (!user?._id) return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref");
    if (!ref) return;
    verifyPaystackDeposit(ref, user._id)
      .then((result: any) => {
        if (result.status === "completed")
          toast.success("Payment verified. Your wallet has been credited.");
        else toast.info("Payment has not completed yet. Check your transaction history.");
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch((error: any) => toast.error(error.message || "Unable to verify payment."));
  }, [user?._id, queryClient]);

  useEffect(() => {
    if (bankData)
      setBanks(bankData.data.map((b: any) => ({ value: b.id, label: b.name, code: b.code })));
  }, [bankData]);

  const handleAmountChange = (e: any) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(Number(value));
    setTotalAmount(Number(value) || 0);
    setCheckoutQuote(null);
  };

  const handleCheckout = async () => {
    if (checkoutQuote) {
      window.location.assign(checkoutQuote.url);
      return;
    }
    setLoading(true);
    try {
      const quote = await initiatePaystackDeposit({ amount: Number(amount) });
      setCheckoutQuote(quote);
    } catch (error: any) {
      toast.error(error.message || "Unable to initialize payment.");
    } finally {
      setLoading(false);
    }
  };

  const validationSchema = Yup.object().shape({
    accountNumber: Yup.string()
      .required("Account number is required")
      .matches(/^\d{10}$/, "Account number must be 10 digits"),
  });

  const handleAccountNumberChange = async (e: any) => {
    const value = e.target.value;
    formik.setFieldValue("accountNumber", value);
    if (value.length === 10) {
      const response = await verifyBankAccount({ accountNumber: value, bankCode: selectedBank?.code });
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
      } catch (error: any) {
        toast.error("Error adding bank account: " + error.message);
      }
    },
  });

  const formatTxDate = (ts: any) =>
    new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const statusColor = (s: string) => {
    if (s === "success" || s === "completed") return "#27805d";
    if (s === "failed" || s === "rejected") return "#b84545";
    return "#9a6818";
  };
  const statusLabel = (s: string) => s?.charAt(0).toUpperCase() + s?.slice(1);
  const txns = transactionsData?.transactions ?? [];
  const totalPages = transactionsData?.totalPages ?? 1;

  return (
    <div className="min-w-0">
      <div className="mb-[30px] flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">
            My Wallet
          </h1>
          <p className="text-[13px] text-muted">Manage your funds, view transactions, and handle payments</p>
        </div>
        <span className="hidden text-[11px] text-muted xs:inline md:inline">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <nav className="mb-5 flex flex-wrap gap-6 border-b border-line" aria-label="Wallet type">
        <button
          aria-pressed={selectedCard === "Naira Wallet"}
          onClick={() => {
            setSelectedCard("Naira Wallet");
            setShowBanks(false);
          }}
          className={tabBtn(selectedCard === "Naira Wallet")}
        >
          <FaBuilding />
          Naira Wallet
        </button>
        <button
          aria-pressed={selectedCard === "Gift Points"}
          onClick={() => setSelectedCard("Gift Points")}
          className={tabBtn(selectedCard === "Gift Points")}
        >
          <FaCopy />
          Gift Points
        </button>
      </nav>

      {selectedCard === "Naira Wallet" &&
        (showBanks ? (
          <Banks user={user} handleShowBanks={() => setShowBanks(false)} openModal={openModal} />
        ) : (
          <>
            <div className="mb-8 grid min-w-0 grid-cols-1 gap-6 nav:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
              <section
                className="flex flex-col items-start rounded-lg bg-night p-5 text-white nav:p-7"
                aria-label="Wallet balance"
              >
                <div className="flex items-center gap-2.5 text-xs text-[#c2ceda]">
                  Available balance
                  <button
                    className="min-h-11 min-w-11 p-1"
                    onClick={() => setHidden(!hidden)}
                    aria-label={hidden ? "Show balance" : "Hide balance"}
                  >
                    {hidden ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <div className="my-4 max-w-full overflow-wrap-anywhere text-[28px] font-medium tabular-nums tracking-[-1px] nav:text-[clamp(28px,3vw,37px)]">
                  {walletData ? (hidden ? "••••••" : formatNairaAmount(walletData.balance ?? 0)) : "—"}
                </div>
                {walletError ? (
                  <button className={`mt-auto ${lightBtn}`} onClick={() => window.location.reload()}>
                    Try again
                  </button>
                ) : (
                  <button className={`mt-auto ${lightBtn}`} onClick={openDepositModal}>
                    <FiPlus />
                    Add Funds
                  </button>
                )}
              </section>
              <section className={panel}>
                <div className={panelHeading}>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Quick actions</h2>
                    <p className="mt-1 text-xs text-muted">Manage your accounts and rewards.</p>
                  </div>
                </div>
                <div className="grid gap-2.5 px-6 pb-6">
                  <button
                    className="flex min-h-[80px] flex-col items-center justify-center gap-2.5 rounded-md border border-line bg-paper p-4 text-xs transition hover:border-accent hover:bg-tint"
                    onClick={() => setShowBanks(true)}
                  >
                    <FaBuilding />
                    <span>Bank Account</span>
                  </button>
                </div>
              </section>
            </div>

            <section className={panel} aria-label="Transactions">
              <div className={panelHeading}>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Transactions</h2>
                  <p className="mt-1 text-xs text-muted">Your recent top-ups.</p>
                </div>
              </div>
              <div className="px-6 pb-4">
                <input
                  type="text"
                  placeholder="Search by reference…"
                  value={reference}
                  onChange={handleSearchChange}
                  className="h-11 w-full rounded-md border border-line bg-bg px-3 text-xs text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40"
                />
              </div>
              {transactionsLoading ? (
                <div className="p-12 text-center" role="status">
                  <p className="text-xs text-muted">Loading your transactions…</p>
                </div>
              ) : transactionsError ? (
                <div className="p-12 text-center">
                  <h3 className="mb-1.5 text-[15px] font-mediumish">We couldn&apos;t load your transactions.</h3>
                  <p className="mb-4 text-xs text-muted">{(transactionsError as any).message}</p>
                  <button className={secondaryBtn} onClick={() => window.location.reload()}>
                    Try again
                  </button>
                </div>
              ) : txns.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-xs text-muted">No transactions found.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-[13px]">
                      <thead>
                        <tr className="border-b border-line">
                          <th className={th}>Reference</th>
                          <th className={`${th} text-right`}>Amount</th>
                          <th className={th}>Status</th>
                          <th className={`${th} text-right`}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txns.map((txn: any, i: number) => (
                          <tr key={i} className="border-b border-line last:border-b-0">
                            <td
                              className={`${td} max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap`}
                              title={txn.reference}
                            >
                              {txn.reference?.length > 16 ? txn.reference.slice(0, 16) + "…" : txn.reference}
                            </td>
                            <td className={`${td} text-right font-medium tabular-nums`}>{formatNairaAmount(txn.amount)}</td>
                            <td className={td}>
                              <span className="text-xs font-medium" style={{ color: statusColor(txn.status) }}>
                                {statusLabel(txn.status)}
                              </span>
                            </td>
                            <td className={`${td} text-right text-muted`}>{formatTxDate(txn.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 px-6 py-4">
                      <button
                        className={secondaryBtn}
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        ← Prev
                      </button>
                      <span className="text-xs text-muted">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        className={secondaryBtn}
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {walletSettingsData && (
              <section className={panel} aria-label="Wallet settings">
                <div className={panelHeading}>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Wallet Settings</h2>
                    <p className="mt-1 text-xs text-muted">Current limits and fees.</p>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  {walletSettingsData.maintenanceMode && (
                    <div className="mb-3 text-[11px] text-danger">
                      ⚠ {walletSettingsData.maintenanceMessage || "Wallet services are temporarily unavailable"}
                    </div>
                  )}
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                    <div>
                      <p className="mb-2 block text-xs font-mediumish text-ink">Min Deposit</p>
                      <p>₦{(walletSettingsData.minDepositAmount || 100).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="mb-2 block text-xs font-mediumish text-ink">Max Deposit</p>
                      <p>₦{(walletSettingsData.maxDepositAmount || 1000000).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="mb-2 block text-xs font-mediumish text-ink">Paystack Fee</p>
                      <p>
                        {walletSettingsData.paystackFee?.percentage || 1.5}% + ₦
                        {(walletSettingsData.paystackFee?.fixedFee || 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {walletSettingsData && walletData?.balance < (walletSettingsData.lowBalanceThreshold || 1000) && (
              <div className="mt-5 rounded-lg border border-line border-l-4 border-l-warning bg-paper p-5">
                <p>
                  <strong>Low Balance Alert</strong> — Your wallet balance is below ₦
                  {(walletSettingsData.lowBalanceThreshold || 1000).toLocaleString()}. Consider adding funds.
                </p>
              </div>
            )}
          </>
        ))}

      {selectedCard === "Gift Points" && <Gift user={user} isDarkMode={isDarkMode} />}

      <Modal isOpen={isModalOpen} closeModal={closeModal} title="Add Bank Account">
        <form onSubmit={formik.handleSubmit}>
          <label className="mb-2 block text-xs font-mediumish text-ink">Select a Bank</label>
          {bankError && <p className="mb-3 text-[11px] text-danger">{(bankError as any).message}</p>}
          <Select
            options={banks}
            value={selectedBank}
            onChange={setSelectedBank}
            isSearchable
            placeholder="Select a bank..."
            className="mb-4"
          />
          <TextField
            name="accountNumber"
            label="Bank Account Number"
            placeholder="Enter account number"
            value={formik.values.accountNumber}
            onChange={handleAccountNumberChange}
            onBlur={formik.handleBlur}
            error={formik.touched.accountNumber && (formik.errors.accountNumber as any)}
            type="text"
            isDarkMode={isDarkMode}
          />
          {formik.touched.accountNumber && formik.errors.accountNumber && (
            <div className="mb-3 text-[11px] text-danger">{formik.errors.accountNumber}</div>
          )}
          <TextField
            name="accountName"
            label="Bank Account Name"
            placeholder="Enter account name"
            value={accountName}
            disabled
            onBlur={formik.handleBlur}
            type="text"
            isDarkMode={isDarkMode}
          />
          <Button type="submit" disabled={!selectedBank}>
            Add Bank Account
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isDepositModalOpen}
        closeModal={closeDepositModal}
        title="Add Funds to Wallet"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4">
          {!depositOption ? (
            <>
              <div className="mb-4 text-center">
                <h3 className="mb-1 text-lg font-semibold">Choose Deposit Method</h3>
                <p className="text-sm text-muted">Select how you&apos;d like to add funds to your wallet</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setDepositOption("automated")}
                  className="flex min-h-[80px] items-center gap-3.5 rounded-md border border-line bg-paper px-5 py-4 text-left transition hover:border-accent hover:bg-tint"
                >
                  <FiPlus />
                  <span className="font-semibold">Automated Deposit</span>
                  <span className="ml-auto text-xs text-muted">→</span>
                </button>
                <button
                  disabled
                  className="flex min-h-[80px] items-center gap-3.5 rounded-md border border-line bg-paper px-5 py-4 text-left opacity-50"
                >
                  <FaBuilding />
                  <span className="font-semibold">Manual Deposit</span>
                  <span className="ml-auto text-xs text-muted">Coming Soon</span>
                </button>
              </div>
            </>
          ) : depositOption === "automated" ? (
            <>
              <h3 className="mb-1 text-center text-lg font-semibold">Enter Deposit Amount</h3>
              <div className="space-y-3">
                <TextField
                  name="amount"
                  label="Deposit Amount (₦)"
                  placeholder={`Min ₦${walletSettingsData?.minDepositAmount || 100}`}
                  value={amount ? amount.toString() : ""}
                  onChange={handleAmountChange}
                  type="text"
                  isDarkMode={isDarkMode}
                  error={false}
                  onBlur={() => {}}
                />
                {amount > 0 && (
                  <div className="rounded-lg border border-line bg-paper p-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted">Deposit Amount:</span>
                      <span className="font-medium">{formatNairaAmount(amount)}</span>
                    </div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted">Processing Fee:</span>
                      <span className="font-medium">
                        {checkoutQuote ? formatNairaAmount(checkoutQuote.processingFee) : "Shown before payment"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm font-semibold">
                      <span>Total:</span>
                      <span>{formatNairaAmount(totalAmount)}</span>
                    </div>
                  </div>
                )}
                {checkoutQuote && (
                  <p className="text-sm">Your wallet will receive {formatNairaAmount(checkoutQuote.creditedAmount)} after fees.</p>
                )}
                <p className="text-xs text-muted">
                  Minimum deposit is ₦{(walletSettingsData?.minDepositAmount || 100).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading || Number(amount) < (walletSettingsData?.minDepositAmount || 100)}
                  className={`${primaryBtn} w-full`}
                >
                  {loading ? "Preparing…" : checkoutQuote ? "Pay now" : "Review payment"}
                </button>
              </div>
            </>
          ) : null}
          {depositOption && (
            <div className="flex justify-center pt-2">
              <button onClick={() => setDepositOption(null)} className={`${textLink} !text-[13px]`}>
                ← Back to Options
              </button>
            </div>
          )}
        </div>
      </Modal>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line py-[18px] text-xs text-muted">
        <span className="flex items-center gap-2.5">
          <FiHelpCircle />
          Need help with a payment?
        </span>
        <Link className={textLink} to="/support">
          Contact support <FiArrowUpRight />
        </Link>
      </div>
    </div>
  );
};

export default Wallet;
