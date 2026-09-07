import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import Table from "../../components/table";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaWallet,
  FaToggleOn,
  FaToggleOff,
  FaMoneyBill,
  FaEye
} from "react-icons/fa";
import {
  depositWallet,
  createWallet as createWalletApi,
  getWallets,
  toggleWallet,
  getAllTransactions,
  getRates,
  setRates,
  getUtilityBalance,
  getWalletSettings,
  updateWalletSettings,
  resetWalletSettings,
  // New withdrawal management functions
  getWithdrawalsForAdmin,
  approveWithdrawal,
  rejectWithdrawal,
  processWithdrawal,
  completeWithdrawal,
  failWithdrawal,
  retryWithdrawal,
  getWithdrawalAuditLogs,
} from "../../api";
import Textfield from "../../../components/ui/forms/input";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Chip from "../../components/status";
import Pagination from "../../components/pagination";
import Select from "react-select";
import { formatNairaAmount } from "../../../utils";

const AdminWalletManagement = () => {
  const users = useSelector((state) => state.admin?.users);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [activeTab, setActiveTab] = useState("Wallets");
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("");
  const [withdrawalSearchQuery, setWithdrawalSearchQuery] = useState("");
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [formattedAmount, setFormattedAmount] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalWithdrawalPages, setTotalWithdrawalPages] = useState(1);
  const limit = 10;

  const [transactionType, setTransactionType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [withdrawalRate, setWithdrawalRate] = useState("");
  const [depositRate, setDepositRate] = useState("");

  // Wallet Settings state
  const [walletSettings, setWalletSettings] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const {
    data: balance,
    isLoading: loadingBalance,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["balance"],
    queryFn: getUtilityBalance,
  });

  const {
    data: walletSettingsData,
    isLoading: loadingWalletSettings,
    error: walletSettingsError,
    refetch: refetchWalletSettings,
  } = useQuery({
    queryKey: ["walletSettings"],
    queryFn: getWalletSettings,
    retry: (failureCount, error) => {
      // Don't retry if it's an authentication error
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const {
    data: rates,
    isLoading: loadingRates,
    error: ratesError,
    refetch: refetchRates,
  } = useQuery({
    queryKey: ["rates"],
    queryFn: getRates,
  });

  const {
    data: wallets,
    isLoading: loadingWallets,
    error: walletError,
    refetch: refetchWallets,
  } = useQuery({
    queryKey: ["wallets", currentPage, limit],
    queryFn: () => getWallets(currentPage, limit),
  });

  const totalWalletPages = wallets?.totalPages || 1;

  const {
    data: transactions,
    isLoading: loadingTransactions,
    error: transactionError,
  } = useQuery({
    queryKey: [
      "transactions",
      currentPage,
      limit,
      transactionType,
      searchQuery,
    ],
    queryFn: () =>
      getAllTransactions(currentPage, limit, transactionType, searchQuery),
  });

  const totalPages = transactions?.totalPages || 1;

  // Fetch withdrawals when Withdrawals tab is active
  useEffect(() => {
    const fetchWithdrawals = async () => {
      if (activeTab === "Withdrawals") {
        setLoadingWithdrawals(true);
        try {
          const params = {
            page: currentPage,
            limit: 10,
          };
          if (withdrawalStatusFilter) {
            params.status = withdrawalStatusFilter;
          }
          if (withdrawalSearchQuery) {
            params.reference = withdrawalSearchQuery;
          }
          const response = await getWithdrawalsForAdmin(params);
          setWithdrawals(response.withdrawals || []);
        } catch (error) {
          console.error("Error fetching withdrawals:", error);
          toast.error("Error fetching withdrawal requests. Please try again.");
          setWithdrawals([]);
        } finally {
          setLoadingWithdrawals(false);
        }
      }
    };

    fetchWithdrawals();
  }, [activeTab, currentPage, withdrawalStatusFilter, withdrawalSearchQuery]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "Transactions" || tab === "Withdrawals") {
      setCurrentPage(1);
    }
  };

  const openModal = (user, createWallet = false) => {
    setSelectedUser(user);
    setIsCreatingWallet(createWallet);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsCreatingWallet(false);
    setIsModalOpen(false);
  };

  const openRate = () => {
    setIsRateOpen(true);
  };

  const closeRate = () => {
    setWithdrawalRate("");
    setDepositRate("");
    setIsRateOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Withdrawal Rate:", withdrawalRate);
    console.log("Deposit Rate:", depositRate);
    closeRate();
  };

  const handleAmountChange = (e, setFieldValue) => {
    const value = e.target.value.replace(/,/g, "");
    const numericValue = parseFloat(value);

    if (!isNaN(numericValue)) {
      const formatted = numericValue.toLocaleString("en-NG");
      setFormattedAmount(formatted);
      setFieldValue("amount", value);
    } else {
      setFormattedAmount("");
      setFieldValue("amount", "");
    }
  };

  const handleAddFunds = async (amount, resetForm) => {
    if (selectedUser) {
      setLoadingTransaction(true);
      try {
        await depositWallet(selectedUser.userId, parseFloat(amount));
        toast.success(
          `Successfully added ₦${amount} to ${selectedUser.username}'s wallet.`
        );
        resetForm();
        setFormattedAmount("");
        refetchWallets();
        closeModal();
      } catch (error) {
        console.error("Add funds error:", error);
        const errorMessage = error?.response?.data?.message || error?.message || "Error adding funds. Please try again.";
        toast.error(errorMessage);
      } finally {
        setLoadingTransaction(false);
      }
    }
  };

  const handleCreateWallet = async () => {
    if (selectedUser) {
      setLoadingTransaction(true);
      try {
        await createWalletApi(selectedUser.userId);
        toast.success(`Wallet created for ${selectedUser.username}.`);
        closeModal();
      } catch (error) {
        console.error("Create wallet error:", error);
        const errorMessage = error?.response?.data?.message || error?.message || "Error creating wallet. Please try again.";
        toast.error(errorMessage);
      } finally {
        setLoadingTransaction(false);
      }
    }
  };

  const handleToggleWallet = async (walletId, isActive) => {
    try {
      await toggleWallet(walletId);
      toast.success(`Wallet has been ${isActive ? "disabled" : "enabled"}.`);
      refetchWallets();
    } catch (error) {
      toast.error("Error toggling wallet status. Please try again.");
    }
  };

  // Wallet Settings functions
  const openSettingsModal = async () => {
    setLoadingSettings(true);
    try {
      const settings = await getWalletSettings();
      setWalletSettings(settings);
      setIsSettingsModalOpen(true);
    } catch (error) {
      toast.error("Error fetching wallet settings. Please try again.");
    } finally {
      setLoadingSettings(false);
    }
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
    setWalletSettings(null);
  };

  const handleUpdateWalletSettings = async (updatedSettings) => {
    try {
      await updateWalletSettings(updatedSettings);
      toast.success("Wallet settings updated successfully!");
      refetchWalletSettings(); // Refetch settings to update the display
      closeSettingsModal();
    } catch (error) {
      toast.error("Error updating wallet settings. Please try again.");
    }
  };

  const handleResetWalletSettings = async () => {
    try {
      const defaultSettings = await resetWalletSettings();
      setWalletSettings(defaultSettings.settings);
      toast.success("Wallet settings reset to defaults!");
    } catch (error) {
      toast.error("Error resetting wallet settings. Please try again.");
    }
  };

  // Function to refresh withdrawals data
  const refreshWithdrawals = async () => {
    if (activeTab === "Withdrawals") {
      setLoadingWithdrawals(true);
      try {
        const params = {
          page: currentPage,
          limit: 10,
        };
        if (withdrawalStatusFilter) {
          params.status = withdrawalStatusFilter;
        }
        if (withdrawalSearchQuery) {
          params.reference = withdrawalSearchQuery;
        }
        const response = await getWithdrawalsForAdmin(params);
        setWithdrawals(response.withdrawals || []);
        setTotalWithdrawalPages(response.totalPages || 1);
        setTotalWithdrawalPages(response.totalPages || 1);
      } catch (error) {
        console.error("Error refreshing withdrawals:", error);
        setWithdrawals([]);
      } finally {
        setLoadingWithdrawals(false);
      }
    }
  };

  // Withdrawal management handlers
  const handleApproveWithdrawal = async (id) => {
    try {
      await approveWithdrawal(id);
      toast.success("Withdrawal approved successfully! User has been notified via email.");
      await refreshWithdrawals();
    } catch (error) {
      toast.error("Error approving withdrawal. Please try again.");
    }
  };

  const handleRejectWithdrawal = async (id) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      await rejectWithdrawal(id, reason);
      toast.success("Withdrawal rejected successfully! User has been notified via email with the rejection reason.");
      await refreshWithdrawals();
    } catch (error) {
      toast.error("Error rejecting withdrawal. Please try again.");
    }
  };

  const handleProcessWithdrawal = async (id) => {
    try {
      await processWithdrawal(id);
      toast.success("Withdrawal processing started! User has been notified via email.");
      await refreshWithdrawals();
    } catch (error) {
      toast.error("Error processing withdrawal. Please try again.");
    }
  };

  const handleCompleteWithdrawal = async (id) => {
    try {
      await completeWithdrawal(id);
      toast.success("Withdrawal completed successfully! User has been notified via email.");
      await refreshWithdrawals();
    } catch (error) {
      toast.error("Error completing withdrawal. Please try again.");
    }
  };

  const handleFailWithdrawal = async (id) => {
    const reason = prompt("Please provide a reason for failure:");
    if (!reason) return;

    try {
      await failWithdrawal(id, reason);
      toast.success("Withdrawal marked as failed! Amount refunded to user's wallet and user notified via email.");
      await refreshWithdrawals();
    } catch (error) {
      toast.error("Error failing withdrawal. Please try again.");
    }
  };

  const handleRetryWithdrawal = async (id) => {
    try {
      await retryWithdrawal(id);
      toast.success("Withdrawal retry initiated! User has been notified via email.");
      await refreshWithdrawals();
    } catch (error) {
      toast.error("Error retrying withdrawal. Please try again.");
    }
  };


  const transactionTypeOptions = [
    { value: "", label: "All" },
    { value: "deposit", label: "Deposit" },
    { value: "withdrawal", label: "Withdrawal" },
  ];

  if (loadingWallets) return <p>Loading wallets...</p>;
  if (walletError) return <p>Error fetching wallets: {walletError.message}</p>;

  return (
    <>
      <div className="mb-4 md:mb-6 p-2 md:p-0">
        <h1 className="ot-admin-page-title text-xl md:text-3xl font-bold ot-admin-ink mb-2">Wallet Management</h1>
        <p className="ot-admin-muted text-sm md:text-base">Manage user wallets, view transactions, and set rates</p>
      </div>

      <div className="mb-4 md:mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 px-2 md:px-0">
        <div className="ot-admin-neutral-card p-4 md:p-6 rounded-lg ">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs md:text-sm font-medium">Total Wallet Balance</p>
              <p className="text-lg md:text-2xl font-bold">{formatNairaAmount(wallets?.totalWalletAmount)}</p>
            </div>
            <FaMoneyBill className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
          </div>
        </div>

        <div className="ot-admin-neutral-card p-4 md:p-6 rounded-lg ">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs md:text-sm font-medium">VTPass Balance</p>
              <p className="text-lg md:text-2xl font-bold">{formatNairaAmount(balance?.balance)}</p>
            </div>
            <FaMoneyBill className="h-6 w-6 md:h-8 md:w-8 text-green-200" />
          </div>
        </div>

        <div className="ot-admin-neutral-card p-4 md:p-6 rounded-lg ">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs md:text-sm font-medium">ClubKonnect Balance</p>
              <p className="text-lg md:text-2xl font-bold">{formatNairaAmount(balance?.clubkonnect)}</p>
            </div>
            <FaMoneyBill className="h-6 w-6 md:h-8 md:w-8 text-purple-200" />
          </div>
        </div>
      </div>

      <nav className="ot-utility-tabs" aria-label="Wallet sections">
        {["Wallets", "Transactions", "Withdrawals", "Settings"].map(tab => <button key={tab} aria-pressed={activeTab === tab} onClick={() => handleTabClick(tab)}>{tab}</button>)}
      </nav>

      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2 px-2 md:px-0">
        <div className="text-xs md:text-sm ot-admin-muted">
          {activeTab === "Wallets" && `${wallets?.wallets?.length || 0} wallets found`}
          {activeTab === "Transactions" && `${transactions?.transactions?.length || 0} transactions found`}
        </div>
        <div className="flex gap-2">
          <button
            onClick={openRate}
            className="ot-admin-control px-3 md:px-6 py-2 md:py-3 ot-admin-action rounded-lg transition-all duration-200 transform text-xs md:text-sm"
          >
            <FaPlus className="inline mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            Set Rates
          </button>
          <button
            onClick={openSettingsModal}
            disabled={loadingSettings}
            className="ot-admin-control px-3 md:px-6 py-2 md:py-3 ot-admin-action rounded-lg transition-all duration-200 transform text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSettings ? (
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FaWallet className="inline mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            )}
            Wallet Settings
          </button>
        </div>
      </div>

      {activeTab === "Wallets" && (
        <>
          {loadingWallets ? (
            <div className="space-y-4">
              {/* Skeleton Loader */}
              {[...Array(5)].map((_, index) => (
                <div key={index} className="ot-admin-paper rounded-lg p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <div className="w-20 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : wallets?.wallets?.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 ot-admin-soft rounded-full flex items-center justify-center mb-4">
                <FaWallet className="h-12 w-12 ot-admin-muted" />
              </div>
              <h3 className="text-lg font-medium ot-admin-ink mb-2">No wallets found</h3>
              <p className="ot-admin-muted">There are no user wallets to display.</p>
            </div>
          ) : (
            <>
              <div className="ot-admin-paper rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="ot-admin-data-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="ot-admin-soft ">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          User Details
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          Wallet Balance
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="ot-admin-paper divide-y divide-gray-200 dark:divide-gray-700">
                      {wallets?.wallets?.map((wallet) => (
                        <tr key={wallet._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                <div className="ot-admin-neutral-card h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center">
                                  <span className="text-xs sm:text-sm font-medium text-white">
                                    {(wallet.username || "N/A").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-4">
                                <div className="text-sm font-medium ot-admin-ink ">
                                  {wallet.username || "N/A"}
                                </div>
                                <div className="text-xs sm:text-sm ot-admin-muted ">
                                  {wallet.email || "N/A"}
                                </div>
                                <div className="text-xs ot-admin-muted ">
                                  ID: {wallet._id.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm sm:text-lg font-semibold ot-admin-ink ">
                              {formatNairaAmount(wallet?.balance)}
                            </div>
                            <div className="text-xs sm:text-sm ot-admin-muted ">
                              {wallet.transactions?.length || 0} transactions
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              wallet.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {wallet.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => handleToggleWallet(wallet._id, wallet.isActive)}
                                  className={`ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors ${
                                    wallet.isActive
                                      ? 'text-green-700 bg-green-100 hover:bg-green-200 border-green-300'
                                      : 'text-red-700 bg-red-100 hover:bg-red-200 border-red-300'
                                  }`}
                                  title={wallet.isActive ? "Disable Wallet" : "Enable Wallet"}
                                >
                                  {wallet.isActive ? (
                                    <FaToggleOn className="mr-1 h-3 w-3" />
                                  ) : (
                                    <FaToggleOff className="mr-1 h-3 w-3" />
                                  )}
                                  <span className="hidden sm:inline">{wallet.isActive ? "Active" : "Inactive"}</span>
                                  <span className="sm:hidden">{wallet.isActive ? "✓" : "✗"}</span>
                                </button>
                                <button
                                  onClick={() => openModal(wallet)}
                                  className="ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ot-admin-action focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                  title="Add funds to wallet"
                                >
                                  <FaPlus className="mr-1 h-3 w-3" />
                                  <span className="hidden sm:inline">Add Funds</span>
                                  <span className="sm:hidden">+</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalWalletPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </>
      )}

      {activeTab === "Transactions" && (
        <div className="overflow-x-auto px-2 md:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-3 md:mb-4 gap-2">
            <Select classNamePrefix="ot-admin-select"
              options={transactionTypeOptions}
              onChange={(selectedOption) => {
                setTransactionType(selectedOption?.value || null);
                setCurrentPage(1);
              }}
              placeholder="Select Type"
              className="w-full sm:w-48 text-sm"
            />
            <Textfield
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {loadingTransactions ? (
            <p>Loading transactions...</p>
          ) : transactionError ? (
            <p>Error fetching transactions: {transactionError.message}</p>
          ) : (
            <>
              <Table
                columns={[
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
                    header: "User",
                    render: (row) => <p>{row.user.username}</p>,
                  },
                  {
                    header: "Amount",
                    render: (row) => <p>{formatNairaAmount(row.amount)}</p>,
                  },
                  { header: "Type", render: (row) => <p>{row.type}</p> },
                  {
                    header: "Timestamp",
                    render: (row) => (
                      <p>{new Date(row.timestamp).toLocaleString()}</p>
                    ),
                  },
                  {
                    header: "Status",
                    render: (row) => <Chip status={row.status} />,
                  },
                ]}
                data={transactions.transactions}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      )}

      {activeTab === "Withdrawals" && (
        <div className="overflow-x-auto px-2 md:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-3 md:mb-4 gap-2">
            <Select classNamePrefix="ot-admin-select"
              options={[
                { value: "", label: "All Statuses" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "processing", label: "Processing" },
                { value: "completed", label: "Completed" },
                { value: "rejected", label: "Rejected" },
                { value: "failed", label: "Failed" },
              ]}
              onChange={(selectedOption) => {
                setWithdrawalStatusFilter(selectedOption?.value || "");
                setCurrentPage(1);
              }}
              placeholder="Filter by Status"
              className="w-full sm:w-48 text-sm"
            />
            <Textfield
              placeholder="Search by reference or user..."
              value={withdrawalSearchQuery}
              onChange={(e) => {
                setWithdrawalSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {loadingWithdrawals ? (
            <div className="space-y-4">
              {/* Skeleton Loader */}
              {[...Array(5)].map((_, index) => (
                <div key={index} className="ot-admin-paper rounded-lg p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="hidden sm:block w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 ot-admin-soft rounded-full flex items-center justify-center mb-4">
                <FaMoneyBill className="h-12 w-12 ot-admin-muted" />
              </div>
              <h3 className="text-lg font-medium ot-admin-ink mb-2">No withdrawals found</h3>
              <p className="ot-admin-muted">There are no withdrawal requests matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="ot-admin-paper rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="ot-admin-data-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="ot-admin-soft ">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          User Details
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          Bank Details
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          Status
                        </th>
                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          Timeline
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="ot-admin-paper divide-y divide-gray-200 dark:divide-gray-700">
                      {withdrawals.map((row) => (
                        <tr key={row._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium ot-admin-ink ">
                                  {row.reference && row.reference.length > 15
                                    ? `${row.reference.slice(0, 15)}...`
                                    : row.reference}
                                </div>
                                <div className="text-sm ot-admin-muted ">
                                  ID: {row._id.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                <div className="ot-admin-neutral-card h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center">
                                  <span className="text-xs sm:text-sm font-medium text-white">
                                    {(row.user?.username || "N/A").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-4">
                                <div className="text-sm font-medium ot-admin-ink ">
                                  {row.user?.username || "N/A"}
                                </div>
                                <div className="text-xs sm:text-sm ot-admin-muted ">
                                  {row.user?.email || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold ot-admin-ink ">
                              {formatNairaAmount(row.amount)}
                            </div>
                            {row.retryCount > 0 && (
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                Retry #{row.retryCount}
                              </div>
                            )}
                          </td>
                          <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm ot-admin-ink ">
                              {row.bankName}
                            </div>
                            <div className="text-sm ot-admin-muted ">
                              {row.accountNumber}
                            </div>
                            {row.accountName && (
                              <div className="text-xs ot-admin-muted ">
                                {row.accountName}
                              </div>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <Chip status={row.status} />
                            {row.processingStartedAt && (
                              <div className="text-xs ot-admin-muted mt-1">
                                Processing since {new Date(row.processingStartedAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm ot-admin-muted ">
                            <div className="space-y-1">
                              <div>
                                <span className="font-medium">Created:</span>
                                <br />
                                {row.createdAt && !isNaN(new Date(row.createdAt).getTime())
                                  ? new Date(row.createdAt).toLocaleDateString()
                                  : 'N/A'}
                              </div>
                              {row.estimatedCompletionTime && (
                                <div>
                                  <span className="font-medium">Est. Complete:</span>
                                  <br />
                                  {new Date(row.estimatedCompletionTime).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-2">
                              {/* Primary Actions */}
                              {row.status === "pending" && (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    onClick={() => handleApproveWithdrawal(row._id)}
                                    className="ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ot-admin-action focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                    title="Approve this withdrawal request"
                                  >
                                    <FaMoneyBill className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">Approve</span>
                                    <span className="sm:hidden">✓</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectWithdrawal(row._id)}
                                    className="ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                    title="Reject this withdrawal request"
                                  >
                                    <FaMoneyBill className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">Reject</span>
                                    <span className="sm:hidden">✗</span>
                                  </button>
                                </div>
                              )}
                              {row.status === "approved" && (
                                <button
                                  onClick={() => handleProcessWithdrawal(row._id)}
                                  className="ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ot-admin-action focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                  title="Start processing this withdrawal"
                                >
                                  <FaMoneyBill className="mr-1 h-3 w-3" />
                                  <span className="hidden sm:inline">Process</span>
                                  <span className="sm:hidden">▶</span>
                                </button>
                              )}
                              {row.status === "processing" && (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    onClick={() => handleCompleteWithdrawal(row._id)}
                                    className="ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ot-admin-action focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                    title="Mark as completed"
                                  >
                                    <FaMoneyBill className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">Complete</span>
                                    <span className="sm:hidden">✓</span>
                                  </button>
                                  <button
                                    onClick={() => handleFailWithdrawal(row._id)}
                                    className="ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                    title="Mark as failed"
                                  >
                                    <FaMoneyBill className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">Fail</span>
                                    <span className="sm:hidden">✗</span>
                                  </button>
                                </div>
                              )}
                              {row.status === "failed" && (
                                <button
                                  onClick={() => handleRetryWithdrawal(row._id)}
                                  className="ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                  title="Retry this failed withdrawal"
                                >
                                  <FaMoneyBill className="mr-1 h-3 w-3" />
                                  <span className="hidden sm:inline">Retry</span>
                                  <span className="sm:hidden">↻</span>
                                </button>
                              )}
                              {/* View Details Button */}
                              <button
                                className="ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border ot-admin-border text-xs font-medium rounded-md ot-admin-ink ot-admin-paper hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                title="View detailed information"
                              >
                                <FaEye className="mr-1 h-3 w-3" />
                                <span className="hidden sm:inline">Details</span>
                                <span className="sm:hidden">👁</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalWithdrawalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6"
          onClick={closeModal}
        >
          <div
            className="ot-admin-paper rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto transform transition-all duration-300 scale-100 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700 dark:hover:scrollbar-thumb-gray-500 px-2 sm:px-0">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <FaWallet className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold ot-admin-ink">
                  {isCreatingWallet ? "Create Wallet" : "Add Funds"}
                </h3>
                <p className="text-sm ot-admin-muted">
                  {isCreatingWallet
                    ? `Create a wallet for ${selectedUser?.username}`
                    : `Add funds to ${selectedUser?.username}'s wallet`
                  }
                </p>
              </div>

              {/* User Details */}
              <div className="mb-6 p-6 rounded-lg ot-admin-soft">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b ot-admin-border">
                    <span className="font-medium ot-admin-muted">Username</span>
                    <span className="font-semibold text-lg ot-admin-ink">
                      {selectedUser?.username}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b ot-admin-border">
                    <span className="font-medium ot-admin-muted">User ID</span>
                    <span className="font-semibold ot-admin-ink">
                      {selectedUser?.userId}
                    </span>
                  </div>
                  {!isCreatingWallet && (
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium ot-admin-muted">Current Balance</span>
                      <span className="font-bold text-xl text-green-600">
                        {formatNairaAmount(selectedUser?.balance)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Formik
                initialValues={{ amount: "" }}
                validationSchema={Yup.object({
                  amount: Yup.number()
                    .required("Amount is required")
                    .positive("Amount must be positive")
                    .min(1, "Amount must be at least ₦1.00"),
                })}
                onSubmit={(values, { resetForm }) => {
                  if (isCreatingWallet) {
                    handleCreateWallet();
                  } else {
                    handleAddFunds(values.amount, resetForm);
                  }
                }}
              >
                {({ errors, touched, setFieldValue }) => (
                  <Form className="space-y-6 pb-8">
                    {!isCreatingWallet && (
                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium ot-admin-ink mb-2">
                          Enter Amount to Add:
                        </label>
                        <Field
                          name="amount"
                          as={Textfield}
                          placeholder="₦0.00"
                          value={formattedAmount}
                          onChange={(e) => handleAmountChange(e, setFieldValue)}
                        />
                        {errors.amount && touched.amount && (
                          <div className="text-red-600 text-sm mt-1">{errors.amount}</div>
                        )}
                      </div>
                    )}

                    {isCreatingWallet && (
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-amber-800">
                              Confirmation Required
                            </p>
                            <p className="text-sm mt-1 text-amber-700">
                              This will create a new wallet for {selectedUser?.username}. This action cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fixed Action Buttons at Bottom */}
                    <div className="flex-shrink-0 pt-4 border-t ot-admin-border mt-4">
                      {/* Action Buttons */}
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={closeModal}
                          disabled={loadingTransaction}
                          className="ot-admin-control flex-1 px-6 py-3 bg-gray-200 ot-admin-ink rounded-lg font-medium transition-all duration-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loadingTransaction}
                          className="ot-admin-control flex-1 px-6 py-3 ot-admin-action rounded-lg font-semibold transition-all duration-200 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative"
                        >
                          {loadingTransaction ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <FaPlus className="h-5 w-5 mr-2" />
                              {isCreatingWallet ? "Create Wallet" : "Add Funds"}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {isRateOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6"
          onClick={closeRate}
        >
          <div
            className="ot-admin-paper rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto transform transition-all duration-300 scale-100 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700 dark:hover:scrollbar-thumb-gray-500 px-2 sm:px-0">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="ot-admin-neutral-card inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                  <FaMoneyBill className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold ot-admin-ink">
                  Set Transaction Rates
                </h3>
                <p className="text-sm ot-admin-muted">
                  Configure withdrawal and deposit rates for the system
                </p>
              </div>

              {/* Current Rates */}
              {loadingRates ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="ot-admin-muted mt-2">Loading current rates...</p>
                </div>
              ) : ratesError ? (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
                  <p className="text-red-800">Error fetching rates: {ratesError.message}</p>
                </div>
              ) : (
                <div className="mb-6 p-6 rounded-lg ot-admin-soft">
                  <h4 className="font-semibold ot-admin-ink mb-4">Current Rates</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b ot-admin-border">
                      <span className="font-medium ot-admin-muted">Withdrawal Rate</span>
                      <span className="font-semibold text-lg ot-admin-ink">
                        {formatNairaAmount(rates?.withdrawalRate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium ot-admin-muted">Deposit Rate</span>
                      <span className="font-semibold text-lg ot-admin-ink">
                        {rates?.depositRate}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Formik
                initialValues={{ withdrawalRate: "", depositRate: "" }}
                validationSchema={Yup.object({
                  withdrawalRate: Yup.number()
                    .required("Withdrawal rate is required")
                    .positive("Rate must be positive"),
                  depositRate: Yup.number()
                    .required("Deposit rate is required")
                    .positive("Rate must be positive"),
                })}
                onSubmit={async (values) => {
                  try {
                    await setRates(values);
                    toast.success("Rates updated successfully!");
                    refetchRates();
                    closeRate();
                  } catch (error) {
                    toast.error("Error updating rates. Please try again.");
                  }
                }}
              >
                {({ handleSubmit }) => (
                  <Form onSubmit={handleSubmit} className="space-y-6 pb-8">
                    <div>
                      <label className="block text-sm font-medium ot-admin-ink mb-2">
                        New Withdrawal Rate:
                      </label>
                      <Field
                        name="withdrawalRate"
                        as={Textfield}
                        placeholder="Enter withdrawal rate"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium ot-admin-ink mb-2">
                        New Deposit Rate (%):
                      </label>
                      <Field
                        name="depositRate"
                        as={Textfield}
                        placeholder="Enter deposit rate"
                      />
                    </div>
                  </Form>
                )}
              </Formik>
            </div>

            {/* Fixed Action Buttons at Bottom */}
            <div className="flex-shrink-0 pt-4 border-t ot-admin-border mt-4">
              <Formik
                initialValues={{ withdrawalRate: "", depositRate: "" }}
                validationSchema={Yup.object({
                  withdrawalRate: Yup.number()
                    .required("Withdrawal rate is required")
                    .positive("Rate must be positive"),
                  depositRate: Yup.number()
                    .required("Deposit rate is required")
                    .positive("Rate must be positive"),
                })}
                onSubmit={async (values) => {
                  try {
                    await setRates(values);
                    toast.success("Rates updated successfully!");
                    refetchRates();
                    closeRate();
                  } catch (error) {
                    toast.error("Error updating rates. Please try again.");
                  }
                }}
              >
                {({ handleSubmit }) => (
                  <form onSubmit={handleSubmit}>
                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={closeRate}
                        className="ot-admin-control flex-1 px-6 py-3 bg-gray-200 ot-admin-ink rounded-lg font-medium transition-all duration-200 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="ot-admin-control flex-1 px-6 py-3 ot-admin-action rounded-lg font-semibold transition-all duration-200 transform "
                      >
                        <FaPlus className="inline mr-2 h-4 w-4" />
                        Update Rates
                      </button>
                    </div>
                  </form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Settings" && (
        <div className="px-2 md:px-0">
          <div className="ot-admin-paper rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold ot-admin-ink">Wallet Settings</h3>
              <button
                onClick={openSettingsModal}
                disabled={loadingWalletSettings}
                className="ot-admin-control px-4 py-2 ot-admin-action text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingWalletSettings ? "Loading..." : "Configure Settings"}
              </button>
            </div>

            {walletSettingsError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-red-800 font-medium">Error loading wallet settings</p>
                    <p className="text-red-600 text-sm">Please check your authentication and try again.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Paystack Fee Settings */}
              <div className="ot-admin-soft p-4 rounded-lg">
                <h4 className="font-medium ot-admin-ink mb-3">Paystack Fee Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="ot-admin-muted">Percentage:</span>
                    <span className="font-medium">{walletSettingsData?.paystackFee?.percentage || 1.5}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="ot-admin-muted">Fixed Fee:</span>
                    <span className="font-medium">₦{walletSettingsData?.paystackFee?.fixedFee || 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="ot-admin-muted">Fee Cap:</span>
                    <span className="font-medium">₦{walletSettingsData?.paystackFee?.cap || 2000}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Limits */}
              <div className="ot-admin-soft p-4 rounded-lg">
                <h4 className="font-medium ot-admin-ink mb-3">Transaction Limits</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="ot-admin-muted">Min Deposit:</span>
                    <span className="font-medium">₦{walletSettingsData?.minDepositAmount || 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="ot-admin-muted">Max Deposit:</span>
                    <span className="font-medium">₦{walletSettingsData?.maxDepositAmount?.toLocaleString() || "1,000,000"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="ot-admin-muted">Min Withdrawal:</span>
                    <span className="font-medium">₦{walletSettingsData?.minWithdrawalAmount || 100}</span>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="ot-admin-soft p-4 rounded-lg">
                <h4 className="font-medium ot-admin-ink mb-3">System Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="ot-admin-muted">Maintenance Mode:</span>
                    <span className={`font-medium ${walletSettingsData?.maintenanceMode ? 'text-red-600' : 'text-green-600'}`}>
                      {walletSettingsData?.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="ot-admin-muted">Auto Approve Deposits:</span>
                    <span className={`font-medium ${walletSettingsData?.autoApproveDeposits ? 'text-green-600' : 'text-red-600'}`}>
                      {walletSettingsData?.autoApproveDeposits ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="ot-admin-muted">Fee Deduction:</span>
                    <span className={`font-medium ${walletSettingsData?.deductFeesFromDeposits ? 'text-green-600' : 'text-red-600'}`}>
                      {walletSettingsData?.deductFeesFromDeposits ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!walletSettingsData && !loadingWalletSettings && (
              <div className="text-center py-8">
                <p className="ot-admin-muted">No settings configured yet. Click "Configure Settings" to set up wallet settings.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wallet Settings Modal */}
      {isSettingsModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6"
          onClick={closeSettingsModal}
        >
          <div
            className="ot-admin-paper rounded-lg w-full max-w-4xl mx-4 transform transition-all duration-300 scale-100 max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full max-h-[95vh]">
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b ot-admin-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold ot-admin-ink">Wallet Settings</h3>
                  <button
                    onClick={closeSettingsModal}
                    className="ot-admin-control ot-admin-muted hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingWalletSettings ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="ot-admin-muted">Loading wallet settings...</p>
                    </div>
                  </div>
                ) : (
                  <Formik
                    initialValues={
                      walletSettingsData && typeof walletSettingsData === 'object' && !walletSettingsData.startsWith?.('<!DOCTYPE')
                        ? walletSettingsData
                        : {
                            paystackFee: { percentage: 1.5, fixedFee: 100, cap: 2000 },
                            monnifyFee: { percentage: 1.5, fixedFee: 100, cap: 2000 },
                            minDepositAmount: 100,
                            maxDepositAmount: 1000000,
                            minWithdrawalAmount: 100,
                            maxWithdrawalAmount: 500000,
                            deductFeesFromDeposits: true,
                            deductFeesFromWithdrawals: false,
                            withdrawalFee: {
                              percentage: 1,
                              fixedFee: 50,
                              cap: 500,
                              deductionMethods: { fromWallet: true, fromWithdrawal: true }
                            },
                            maintenanceMode: false,
                            maintenanceMessage: "Wallet services are temporarily unavailable for maintenance.",
                            autoApproveDeposits: true,
                            autoApproveWithdrawals: false,
                            emailNotifications: {
                              depositSuccess: true,
                              withdrawalSuccess: true,
                              lowBalance: true
                            },
                            lowBalanceThreshold: 1000
                          }
                    }
                    validationSchema={Yup.object({
                      paystackFee: Yup.object({
                        percentage: Yup.number().min(0).max(100).required(),
                        fixedFee: Yup.number().min(0).required(),
                        cap: Yup.number().min(0).required()
                      }),
                      withdrawalFee: Yup.object({
                        percentage: Yup.number().min(0).max(100).required(),
                        fixedFee: Yup.number().min(0).required(),
                        cap: Yup.number().min(0).required()
                      }),
                      minDepositAmount: Yup.number().min(1).required(),
                      maxDepositAmount: Yup.number().min(1).required(),
                      minWithdrawalAmount: Yup.number().min(1).required(),
                      maxWithdrawalAmount: Yup.number().min(1).required(),
                      lowBalanceThreshold: Yup.number().min(0).required()
                    })}
                    onSubmit={handleUpdateWalletSettings}
                  >
                    {({ values, setFieldValue, handleSubmit, isSubmitting, errors, touched }) => (
                      <Form onSubmit={handleSubmit} className="space-y-8">
                        {/* Paystack Fee Settings */}
                        <div className="ot-admin-soft p-6 rounded-lg">
                          <h4 className="text-lg font-semibold ot-admin-ink mb-4">Paystack Fee Settings</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Percentage (%)
                              </label>
                              <Field
                                name="paystackFee.percentage"
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Fixed Fee (₦)
                              </label>
                              <Field
                                name="paystackFee.fixedFee"
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Fee Cap (₦)
                              </label>
                              <Field
                                name="paystackFee.cap"
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Transaction Limits */}
                        <div className="ot-admin-soft p-6 rounded-lg">
                          <h4 className="text-lg font-semibold ot-admin-ink mb-4">Transaction Limits</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Minimum Deposit (₦)
                              </label>
                              <Field
                                name="minDepositAmount"
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Maximum Deposit (₦)
                              </label>
                              <Field
                                name="maxDepositAmount"
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Minimum Withdrawal (₦)
                              </label>
                              <Field
                                name="minWithdrawalAmount"
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Maximum Withdrawal (₦)
                              </label>
                              <Field
                                name="maxWithdrawalAmount"
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Fee Deduction Settings */}
                        <div className="ot-admin-soft p-6 rounded-lg">
                          <h4 className="text-lg font-semibold ot-admin-ink mb-4">Fee Deduction Settings</h4>
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <Field
                                name="deductFeesFromDeposits"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                              />
                              <label className="ml-2 block text-sm ot-admin-ink">
                                Deduct processing fees from deposit amounts
                              </label>
                            </div>
                            <div className="flex items-center">
                              <Field
                                name="deductFeesFromWithdrawals"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                              />
                              <label className="ml-2 block text-sm ot-admin-ink">
                                Deduct processing fees from withdrawal amounts
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Withdrawal Fee Settings */}
                        <div className="ot-admin-soft p-6 rounded-lg">
                          <h4 className="text-lg font-semibold ot-admin-ink mb-4">Withdrawal Fee Settings</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Percentage (%)
                              </label>
                              <Field
                                name="withdrawalFee.percentage"
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Fixed Fee (₦)
                              </label>
                              <Field
                                name="withdrawalFee.fixedFee"
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium ot-admin-ink mb-2">
                                Fee Cap (₦)
                              </label>
                              <Field
                                name="withdrawalFee.cap"
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="mt-4 space-y-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <strong>Fee Calculation:</strong> Fixed Fee + (Amount × Percentage), capped at the maximum fee limit.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-sm font-medium ot-admin-ink">Available Fee Deduction Methods</h5>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Field
                                    name="withdrawalFee.deductionMethods.fromWallet"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                                  />
                                  <label className="ml-2 block text-sm ot-admin-ink">
                                    Allow deduction from wallet balance
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <Field
                                    name="withdrawalFee.deductionMethods.fromWithdrawal"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                                  />
                                  <label className="ml-2 block text-sm ot-admin-ink">
                                    Allow deduction from withdrawal amount
                                  </label>
                                </div>
                              </div>
                              <p className="text-xs ot-admin-muted">
                                Users can choose how they want to pay the withdrawal fee.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* System Settings */}
                        <div className="ot-admin-soft p-6 rounded-lg">
                          <h4 className="text-lg font-semibold ot-admin-ink mb-4">System Settings</h4>
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <Field
                                name="maintenanceMode"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                              />
                              <label className="ml-2 block text-sm ot-admin-ink">
                                Enable maintenance mode
                              </label>
                            </div>
                            <div className="flex items-center">
                              <Field
                                name="autoApproveDeposits"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                              />
                              <label className="ml-2 block text-sm ot-admin-ink">
                                Auto-approve deposits
                              </label>
                            </div>
                            <div className="flex items-center">
                              <Field
                                name="autoApproveWithdrawals"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                              />
                              <label className="ml-2 block text-sm ot-admin-ink">
                                Auto-approve withdrawals
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Email Notifications */}
                        <div className="ot-admin-soft p-6 rounded-lg">
                          <h4 className="text-lg font-semibold ot-admin-ink mb-4">Email Notifications</h4>
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <Field
                                name="emailNotifications.depositSuccess"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                              />
                              <label className="ml-2 block text-sm ot-admin-ink">
                                Send email on successful deposits
                              </label>
                            </div>
                            <div className="flex items-center">
                              <Field
                                name="emailNotifications.withdrawalSuccess"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                              />
                              <label className="ml-2 block text-sm ot-admin-ink">
                                Send email on successful withdrawals
                              </label>
                            </div>
                            <div className="flex items-center">
                              <Field
                                name="emailNotifications.lowBalance"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 ot-admin-border rounded"
                              />
                              <label className="ml-2 block text-sm ot-admin-ink">
                                Send email on low balance alerts
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Low Balance Threshold */}
                        <div className="ot-admin-soft p-6 rounded-lg">
                          <h4 className="text-lg font-semibold ot-admin-ink mb-4">Low Balance Alert</h4>
                          <div>
                            <label className="block text-sm font-medium ot-admin-ink mb-2">
                              Low Balance Threshold (₦)
                            </label>
                            <Field
                              name="lowBalanceThreshold"
                              type="number"
                              min="0"
                              className="w-full px-3 py-2 border ot-admin-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-6 border-t ot-admin-border">
                          <button
                            type="button"
                            onClick={handleResetWalletSettings}
                            className="ot-admin-control px-4 py-2 ot-admin-muted border ot-admin-border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          >
                            Reset to Defaults
                          </button>
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={closeSettingsModal}
                              className="ot-admin-control px-4 py-2 ot-admin-muted border ot-admin-border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="ot-admin-control px-6 py-2 ot-admin-action text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? 'Saving...' : 'Save Settings'}
                            </button>
                          </div>
                        </div>
                      </Form>
                    )}
                  </Formik>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AdminWalletManagement;
