import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import Table from "../../components/table";
import Button from "../../../components/ui/forms/button";
import { toast } from "react-toastify";
import Modal from "../../components/modal";
import {
  FaPlus,
  FaWallet,
  FaToggleOn,
  FaToggleOff,
  FaMoneyBill,
} from "react-icons/fa";
import {
  depositWallet,
  createWallet as createWalletApi,
  getWallets,
  toggleWallet,
  getAllTransactions,
  getRates,
  setRates,
  getUtilityBalance
} from "../../api";
import Textfield from "../../../components/ui/forms/input";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Chip from "../../../components/ui/chip";
import Card from "./card";
import Pagination from "../../components/pagination";
import Select from "react-select";
import { formatNairaAmount } from "../../../utils";

const AdminWalletManagement = () => {
  const users = useSelector((state) => state.admin.users);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [activeTab, setActiveTab] = useState("Wallets");
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [formattedAmount, setFormattedAmount] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const [transactionType, setTransactionType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [withdrawalRate, setWithdrawalRate] = useState("");
  const [depositRate, setDepositRate] = useState("");

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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "Transactions") {
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
        toast.error("Error adding funds. Please try again.");
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
        toast.error("Error creating wallet. Please try again.");
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
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">Wallet Management</h1>
        <p className="text-gray-600 text-sm md:text-base">Manage user wallets, view transactions, and set rates</p>
      </div>

      <div className="mb-4 md:mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 px-2 md:px-0">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs md:text-sm font-medium">Total Wallet Balance</p>
              <p className="text-lg md:text-2xl font-bold">{formatNairaAmount(wallets?.totalWalletAmount)}</p>
            </div>
            <FaMoneyBill className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs md:text-sm font-medium">VTPass Balance</p>
              <p className="text-lg md:text-2xl font-bold">{formatNairaAmount(balance?.balance)}</p>
            </div>
            <FaMoneyBill className="h-6 w-6 md:h-8 md:w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs md:text-sm font-medium">ClubKonnect Balance</p>
              <p className="text-lg md:text-2xl font-bold">{formatNairaAmount(balance?.clubkonnect)}</p>
            </div>
            <FaMoneyBill className="h-6 w-6 md:h-8 md:w-8 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="mb-4 md:mb-6 flex flex-wrap rounded-lg border border-gray-300 bg-gray-50 py-1 px-1 w-full max-w-md md:max-w-none">
        <button
          className={`flex-1 md:flex-none md:w-40 py-2 md:py-3 px-3 md:px-4 font-medium text-xs md:text-sm transition-all duration-300 rounded-lg ${
            activeTab === "Wallets"
              ? "bg-white text-blue-600 shadow-sm border border-blue-200"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
          onClick={() => handleTabClick("Wallets")}
        >
          <FaWallet className="inline mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          Wallets
        </button>
        <button
          className={`flex-1 md:flex-none md:w-40 py-2 md:py-3 px-3 md:px-4 font-medium text-xs md:text-sm transition-all duration-300 rounded-lg ${
            activeTab === "Transactions"
              ? "bg-white text-blue-600 shadow-sm border border-blue-200"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
          onClick={() => handleTabClick("Transactions")}
        >
          <FaMoneyBill className="inline mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          Transactions
        </button>
      </div>

      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2 px-2 md:px-0">
        <div className="text-xs md:text-sm text-gray-600">
          {activeTab === "Wallets" && `${wallets?.wallets?.length || 0} wallets found`}
          {activeTab === "Transactions" && `${transactions?.transactions?.length || 0} transactions found`}
        </div>
        <button
          onClick={openRate}
          className="px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-xs md:text-sm"
        >
          <FaPlus className="inline mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          Set Rates
        </button>
      </div>

      {activeTab === "Wallets" && (
        <>
          <div className="overflow-x-auto px-2 md:px-0">
            <Table
              columns={[
                { header: "User", render: (row) => <p>{row.username}</p> },
                {
                  header: "Wallet Balance",
                  render: (row) => <p>{formatNairaAmount(row?.balance)}</p>,
                },
                {
                  header: "Actions",
                  render: (row) => (
                    <div className="flex space-x-3">
                      <button
                        onClick={() =>
                          handleToggleWallet(row._id, row.isActive)
                        }
                        className={`flex justify-center items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                          row.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                            : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                        }`}
                        title={row.isActive ? "Disable Wallet" : "Enable Wallet"}
                      >
                        {row.isActive ? (
                          <FaToggleOn className="mr-1" size={14} />
                        ) : (
                          <FaToggleOff className="mr-1" size={14} />
                        )}
                        {row.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => openModal(row)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        title="Add Funds"
                      >
                        <FaPlus className="mr-1" size={14} />
                        Add Funds
                      </button>
                    </div>
                  ),
                },
              ]}
              data={wallets?.wallets}
            />
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalWalletPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {activeTab === "Transactions" && (
        <div className="overflow-x-auto px-2 md:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-3 md:mb-4 gap-2">
            <Select
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
              className="flex-1 text-sm"
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

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto transform transition-all duration-300 scale-100 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700 dark:hover:scrollbar-thumb-gray-500 px-2 sm:px-0">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <FaWallet className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isCreatingWallet ? "Create Wallet" : "Add Funds"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isCreatingWallet
                    ? `Create a wallet for ${selectedUser?.username}`
                    : `Add funds to ${selectedUser?.username}'s wallet`
                  }
                </p>
              </div>

              {/* User Details */}
              <div className="mb-6 p-6 rounded-xl bg-gray-50">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-600">Username</span>
                    <span className="font-semibold text-lg text-gray-900">
                      {selectedUser?.username}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-600">User ID</span>
                    <span className="font-semibold text-gray-900">
                      {selectedUser?.userId}
                    </span>
                  </div>
                  {!isCreatingWallet && (
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-600">Current Balance</span>
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
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                          Enter Amount to Add:
                        </label>
                        <Field
                          name="amount"
                          as={Textfield}
                          placeholder="₦0.00"
                          value={formattedAmount}
                          onChange={(e) => handleAmountChange(e, setFieldValue)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  </Form>
                )}
              </Formik>
            </div>

            {/* Fixed Action Buttons at Bottom */}
            <div className="flex-shrink-0 pt-4 border-t border-gray-200 mt-4">
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
                {({ handleSubmit }) => (
                  <form onSubmit={handleSubmit}>
                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={loadingTransaction}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200 hover:bg-gray-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loadingTransaction}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative"
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
                  </form>
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
            className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto transform transition-all duration-300 scale-100 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700 dark:hover:scrollbar-thumb-gray-500 px-2 sm:px-0">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full mb-4">
                  <FaMoneyBill className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Set Transaction Rates
                </h3>
                <p className="text-sm text-gray-600">
                  Configure withdrawal and deposit rates for the system
                </p>
              </div>

              {/* Current Rates */}
              {loadingRates ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading current rates...</p>
                </div>
              ) : ratesError ? (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
                  <p className="text-red-800">Error fetching rates: {ratesError.message}</p>
                </div>
              ) : (
                <div className="mb-6 p-6 rounded-xl bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-4">Current Rates</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium text-gray-600">Withdrawal Rate</span>
                      <span className="font-semibold text-lg text-gray-900">
                        {formatNairaAmount(rates?.withdrawalRate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-600">Deposit Rate</span>
                      <span className="font-semibold text-lg text-gray-900">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Withdrawal Rate:
                      </label>
                      <Field
                        name="withdrawalRate"
                        as={Textfield}
                        placeholder="Enter withdrawal rate"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Deposit Rate (%):
                      </label>
                      <Field
                        name="depositRate"
                        as={Textfield}
                        placeholder="Enter deposit rate"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </Form>
                )}
              </Formik>
            </div>

            {/* Fixed Action Buttons at Bottom */}
            <div className="flex-shrink-0 pt-4 border-t border-gray-200 mt-4">
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
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
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
    </>
  );
};

export default AdminWalletManagement;
