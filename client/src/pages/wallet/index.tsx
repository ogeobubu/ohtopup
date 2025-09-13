import React, { useState, useEffect } from "react";
import { PaystackButton } from "react-paystack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "./card";
import { FaBuilding, FaExclamationCircle, FaCopy, FaWallet, FaCreditCard, FaHistory, FaPlus, FaMinus, FaUniversity } from "react-icons/fa";
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
  depositWallet,
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
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const refParam = queryParams.get("ref");
    const successParam = queryParams.get("success");
    const errorParam = queryParams.get("error");
    const statusParam = queryParams.get("status");
    const referenceParam = queryParams.get("reference");

    if (refParam) {
      setRef(refParam);
    }

    // Handle Paystack callback responses
    if (successParam === "true") {
      toast.success("Payment successful! Your wallet has been credited.");
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      let errorMessage = "Payment failed. Please try again.";
      switch (errorParam) {
        case "payment_failed":
          errorMessage = "Payment was declined. Please check your card details and try again.";
          break;
        case "verification_failed":
          errorMessage = "Payment verification failed. Please contact support.";
          break;
        case "verification_error":
          errorMessage = "There was an error verifying your payment. Please contact support.";
          break;
        case "callback_error":
          errorMessage = "Payment processing error. Please contact support.";
          break;
        case "missing_reference":
          errorMessage = "Payment reference missing. Please try again.";
          break;
      }
      toast.error(errorMessage);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (statusParam === "pending") {
      toast.info("Payment is being processed. Please wait a few minutes.");
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Refresh wallet data if we have a reference (successful payment)
    if (referenceParam && successParam === "true") {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    }
  }, [queryClient]);

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

  const { data: walletSettingsData, error: walletSettingsError } = useQuery({
    queryKey: ["walletSettings"],
    queryFn: getWalletSettings,
    enabled: selectedCard === "Naira Wallet", // Only fetch when on wallet tab
  });

  // Update wallet settings state when data is fetched
  useEffect(() => {
    if (walletSettingsData) {
      console.log('Wallet settings fetched:', walletSettingsData);
      setWalletSettings(walletSettingsData);
    }
  }, [walletSettingsData]);

  // Validate Paystack configuration
  const getPaystackConfig = () => {
    if (!user?.email) {
      console.error('Paystack config error: User email is missing');
      return null;
    }
    if (!user?._id) {
      console.error('Paystack config error: User ID is missing');
      return null;
    }
    if (!totalAmount || totalAmount <= 0) {
      console.error('Paystack config error: Invalid amount', totalAmount);
      return null;
    }
    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_TEST_KEY) {
      console.error('Paystack config error: Public key is missing');
      return null;
    }

    return {
      reference: `txn_${Date.now()}_${user._id}`,
      email: user.email,
      amount: Math.round(totalAmount * 100), // Ensure it's an integer
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    };
  };

  const config = getPaystackConfig();

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
    const value = e.target.value.replace(/[^0-9]/g, "");

    if (value === "" || !isNaN(value)) {
      setAmount(value);

      if (value === "") {
        setTotalAmount(0);
      } else {
        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
          // Calculate fee based on wallet settings
          let fee = 0;
          if (walletSettingsData?.paystackFee) {
            const { percentage, fixedFee, cap } = walletSettingsData.paystackFee;
            fee = Math.min(cap || 2000, (parsedValue * (percentage || 1.5) / 100) + (fixedFee || 100));
          } else {
            // Fallback to old calculation
            fee = parsedValue * (rates?.depositRate / 100);
          }
          setTotalAmount(parsedValue + fee);
        } else {
          setTotalAmount(0);
        }
      }
    }
  };

  const formattedAmount = amount ? amount.toString() : "";

  const handlePaystackSuccessAction = async (reference) => {
    console.log('Paystack success callback:', reference);
    setLoading(true);

    try {
      // The reference object from react-paystack contains the transaction reference
      const transactionRef = reference.reference || reference.trxref;

      if (!transactionRef) {
        console.error('No transaction reference in Paystack response');
        toast.error("Payment reference missing. Please contact support.");
        setLoading(false);
        return;
      }

      // Verify the payment with our backend
      const verifyResponse = await verifyPaystackDeposit(transactionRef, user?._id);

      if (verifyResponse) {
        toast.success("Payment successful! Funds have been added to your wallet.");
        setIsDepositModalOpen(false);
        setAmount(0);
        setTotalAmount(0);
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }
    } catch (error) {
      console.error("Error during Paystack verification:", error);
      toast.error("Payment verification failed. Please contact support if amount was debited.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackCloseAction = () => {
    console.log("closed");
  };

  const componentProps = config ? {
    ...config,
    text: loading ? "Processing..." : "Pay Now",
    onSuccess: (reference) => handlePaystackSuccessAction(reference),
    onClose: () => {
      console.log('Paystack payment modal closed');
      setLoading(false);
    },
  } : {};

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

  const formattedBalance =
    walletData && walletData?.balance
      ? walletData?.balance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  const [whole, decimal] = formattedBalance.split(".");

  return (
    <>
      <div className="mb-6 md:mb-8">
        <h1
          className={`text-2xl md:text-3xl font-bold mb-2 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          My Wallet
        </h1>
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Manage your funds, view transactions, and handle payments
        </p>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card
          title="Naira Wallet"
          balance={walletData?.balance}
          color="blue"
          onClick={() => setSelectedCard("Naira Wallet")}
          isActive={selectedCard === "Naira Wallet"}
        />
        <Card
          title="Gift Points"
          balance={500}
          color="green"
          onClick={() => setSelectedCard("Gift Points")}
          isActive={selectedCard === "Gift Points"}
        />
      </div>
      {selectedCard === "Naira Wallet" && (
        <>
          {showBanks ? (
            <Banks
              user={user}
              handleShowBanks={handleShowBanks}
              openModal={openModal}
            />
          ) : (
            /* Wallet Balance Card */
            <div className={`rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className={`p-2 md:p-3 rounded-full ${
                      isDarkMode ? "bg-blue-600" : "bg-blue-100"
                    }`}>
                      <FaWallet className={`text-lg md:text-xl ${
                        isDarkMode ? "text-white" : "text-blue-600"
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold">Naira Balance</h3>
                      <p className={`text-xs md:text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}>
                        Available funds
                      </p>
                    </div>
                  </div>
                  {walletError && (
                    <div className="flex items-center text-red-500 text-xs md:text-sm">
                      <FaExclamationCircle className="mr-1" />
                      <span>{walletError.message}</span>
                    </div>
                  )}
                </div>

                <div className="mb-4 md:mb-6">
                  <div className={`text-2xl md:text-4xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    <span className="text-lg md:text-2xl text-gray-500">₦</span>
                    {whole}
                    <span className="text-lg md:text-2xl text-gray-500">.{decimal}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <button
                    onClick={openDepositModal}
                    className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border-2 border-dashed border-green-300 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center mb-1 md:mb-2 group-hover:scale-110 transition-transform">
                      <FaPlus className="text-white text-base md:text-lg" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-green-700 dark:text-green-400 text-center">
                      Add Funds
                    </span>
                  </button>

                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border-2 border-dashed border-red-300 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500 rounded-full flex items-center justify-center mb-1 md:mb-2 group-hover:scale-110 transition-transform">
                      <FaMinus className="text-white text-base md:text-lg" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-red-700 dark:text-red-400 text-center">
                      Withdraw
                    </span>
                  </button>

                  <button
                    onClick={handleShowBanks}
                    className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-full flex items-center justify-center mb-1 md:mb-2 group-hover:scale-110 transition-transform">
                      <FaUniversity className="text-white text-base md:text-lg" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-400 text-center">
                      Bank Account
                    </span>
                  </button>
                </div>
             

              <div className="mt-5">
                <div
                  className={`flex md:flex-row flex-col rounded-lg border border-solid w-full max-w-xs md:max-w-sm ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700"
                      : "border-gray-300 bg-[#F7F9FB]"
                  } py-1 px-1`}
                >
                  <button
                    className={`py-2 px-2 md:px-1 md:py-1 md:w-40 w-full font-medium text-sm transition-colors duration-300 ${
                      activeTab === "deposit"
                        ? "text-blue-500 bg-white rounded-lg"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                    onClick={() => handleTabClick("deposit")}
                  >
                    Topup
                  </button>
                  <button
                    className={`py-2 px-2 md:px-1 md:py-1 md:w-40 w-full font-medium text-sm transition-colors duration-300 ${
                      activeTab === "withdrawal"
                        ? "text-blue-500 bg-white rounded-lg"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                    onClick={() => handleTabClick("withdrawal")}
                  >
                    Withdrawal
                  </button>
                </div>

                <div className="mt-6">
                  {transactionsLoading ? (
                    <p>Loading transactions...</p>
                  ) : transactionsError ? (
                    <p>
                      Error fetching transactions: {transactionsError.message}
                    </p>
                  ) : (
                    <>
                      <div className="flex justify-start md:justify-end">
                        <input
                          type="text"
                          placeholder="Search by Reference..."
                          value={reference}
                          onChange={handleSearchChange}
                          className={`border rounded-md px-3 py-2 mb-3 w-full max-w-xs text-sm ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-800 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          }`}
                        />
                      </div>
                      <DataTable
                        columns={activeTab === "withdrawal" ? columns : topupColumns}
                        data={transactionsData?.transactions}
                        emptyMessage="No transactions found"
                      />
                      <div className="mt-4">
                        <ModernPagination
                          currentPage={currentPage}
                          totalPages={transactionsData?.totalPages}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Wallet Settings Information */}
          {walletSettingsData && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Maintenance Mode Alert */}
              {walletSettingsData.maintenanceMode && (
                <div className={`p-4 rounded-lg border-2 ${
                  isDarkMode
                    ? 'bg-red-900/20 border-red-600 text-red-200'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    <FaExclamationCircle className="text-red-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Maintenance Mode</h4>
                      <p className="text-xs mt-1">
                        {walletSettingsData.maintenanceMessage || "Wallet services are temporarily unavailable"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Limits */}
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Transaction Limits
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Min Deposit:
                    </span>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      ₦{walletSettingsData.minDepositAmount || 100}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Max Deposit:
                    </span>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      ₦{walletSettingsData.maxDepositAmount?.toLocaleString() || "1,000,000"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Min Withdrawal:
                    </span>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      ₦{walletSettingsData.minWithdrawalAmount || 100}
                    </span>
                  </div>
                </div>
              </div>

              {/* Processing Fees */}
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold text-sm mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Processing Fees
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Paystack Fee:
                    </span>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {walletSettingsData.paystackFee?.percentage || 1.5}% + ₦{walletSettingsData.paystackFee?.fixedFee || 100}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Fee Cap:
                    </span>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      ₦{walletSettingsData.paystackFee?.cap || 2000}
                    </span>
                  </div>
                  <div className="text-xs mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                    <p className={isDarkMode ? 'text-blue-200' : 'text-blue-800'}>
                      💡 Processing fees are automatically deducted from your deposits
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Low Balance Alert */}
          {walletSettingsData && walletData?.balance < (walletSettingsData.lowBalanceThreshold || 1000) && (
            <div className={`mt-4 p-4 rounded-lg border-l-4 border-yellow-500 ${
              isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
            }`}>
              <div className="flex items-center space-x-2">
                <FaExclamationCircle className="text-yellow-500 flex-shrink-0" />
                <div>
                  <h4 className={`font-semibold text-sm ${
                    isDarkMode ? 'text-yellow-200' : 'text-yellow-800'
                  }`}>
                    Low Balance Alert
                  </h4>
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                  }`}>
                    Your wallet balance is below ₦{walletSettingsData.lowBalanceThreshold || 1000}.
                    Consider adding funds to avoid transaction interruptions.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Modal
            isOpen={isModalOpen}
            closeModal={closeModal}
            title="Add Bank Account"
          >
            <form onSubmit={formik.handleSubmit} className="">
              <label className="block text-gray-500 mb-2">Select a Bank</label>
              {bankError && <p className="text-red-500">{bankError.message}</p>}
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
                className={`border ${
                  formik.touched.accountNumber && formik.errors.accountNumber
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formik.touched.accountNumber && formik.errors.accountNumber && (
                <div className="text-red-500 text-sm mb-3">
                  {formik.errors.accountNumber}
                </div>
              )}
              <TextField
                name="accountName"
                label="Bank Account Name"
                placeholder="Enter account name"
                value={accountName}
                disabled
                onBlur={formik.handleBlur}
                className={`border ${
                  formik.touched.accountName && formik.errors.accountName
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
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
            <div className="space-y-4 md:space-y-6">
              {!depositOption ? (
                <>
                  {/* Header */}
                  <div className="text-center mb-4 md:mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full mb-3 md:mb-4 ${
                      isDarkMode ? 'bg-green-600' : 'bg-green-100'
                    }`}>
                      <FaPlus className={`text-xl md:text-2xl ${
                        isDarkMode ? 'text-white' : 'text-green-600'
                      }`} />
                    </div>
                    <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Choose Deposit Method
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Select how you'd like to add funds to your wallet
                    </p>
                  </div>

                  {/* Deposit Options */}
                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                    <button
                      onClick={() => setDepositOption("automated")}
                      className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-200 text-left group ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-800 hover:border-blue-500 hover:bg-gray-700'
                          : 'border-gray-200 bg-white hover:border-blue-500 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className={`p-2 md:p-3 rounded-lg ${
                          isDarkMode ? 'bg-blue-600' : 'bg-blue-100'
                        }`}>
                          <FaCreditCard className={`text-lg md:text-xl ${
                            isDarkMode ? 'text-white' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-base md:text-lg mb-1 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Automated Deposit
                          </h4>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Instant deposit via card or bank transfer
                          </p>
                        </div>
                        <div className={`text-xl md:text-2xl transition-transform group-hover:translate-x-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-400'
                        }`}>
                          →
                        </div>
                      </div>
                    </button>

                    <button
                      disabled={true}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 text-left opacity-60 cursor-not-allowed ${
                        isDarkMode
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          <FaUniversity className={`text-xl ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold text-lg mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Manual Deposit
                          </h4>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Transfer to our account (Coming Soon)
                          </p>
                        </div>
                        <div className={`text-2xl ${
                          isDarkMode ? 'text-gray-600' : 'text-gray-300'
                        }`}>
                          →
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              ) : depositOption === "automated" ? (
                <>
                  {/* Automated Deposit Form */}
                  <div className="text-center mb-4 md:mb-6">
                    <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full mb-3 md:mb-4 ${
                      isDarkMode ? 'bg-blue-600' : 'bg-blue-100'
                    }`}>
                      <FaCreditCard className={`text-lg md:text-xl ${
                        isDarkMode ? 'text-white' : 'text-blue-600'
                      }`} />
                    </div>
                    <h3 className={`text-base md:text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Enter Deposit Amount
                    </h3>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-3 md:space-y-4">
                    <TextField
                      name="amount"
                      label="Deposit Amount (₦)"
                      placeholder={`Enter amount (minimum ₦${walletSettingsData?.minDepositAmount || 100})`}
                      value={formattedAmount}
                      onChange={handleAmountChange}
                      type="text"
                      isDarkMode={isDarkMode}
                    />

                    {/* Amount Summary */}
                    {amount > 0 && (
                      <div className={`p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                              Deposit Amount:
                            </span>
                            <span className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatNairaAmount(amount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                              Processing Fee:
                            </span>
                            <span className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatNairaAmount(totalAmount - amount)}
                            </span>
                          </div>
                          <div className={`border-t pt-2 ${
                            isDarkMode ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="flex justify-between font-semibold">
                              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                Total Amount:
                              </span>
                              <span className={`text-lg ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {formatNairaAmount(totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Minimum Amount Notice */}
                    <div className={`p-3 rounded-lg text-sm ${
                      isDarkMode
                        ? 'bg-yellow-900/20 border border-yellow-600/30'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <FaExclamationCircle className="text-yellow-500 flex-shrink-0" />
                        <span className={isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}>
                          Minimum deposit amount is ₦{walletSettingsData?.minDepositAmount || 100}
                        </span>
                      </div>
                    </div>

                    {/* Payment Button */}
                    <div className="pt-4">
                      {config ? (
                        <PaystackButton
                          {...componentProps}
                          disabled={amount < (walletSettingsData?.minDepositAmount || 100) || loading}
                          className={`w-full py-3 text-lg font-semibold rounded-lg transition-colors ${
                            amount >= (walletSettingsData?.minDepositAmount || 100) && !loading
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        />
                      ) : (
                        <button
                          disabled
                          className="w-full py-3 text-lg font-semibold rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed"
                        >
                          Loading payment details...
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Manual Deposit Instructions */}
                  <div className="text-center mb-4 md:mb-6">
                    <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full mb-3 md:mb-4 ${
                      isDarkMode ? 'bg-orange-600' : 'bg-orange-100'
                    }`}>
                      <FaUniversity className={`text-lg md:text-xl ${
                        isDarkMode ? 'text-white' : 'text-orange-600'
                      }`} />
                    </div>
                    <h3 className={`text-base md:text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Manual Deposit Instructions
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Transfer funds to our account details below
                    </p>
                  </div>

                  <div className={`p-6 rounded-xl ${
                    isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
                        <span className={`font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Bank Name:
                        </span>
                        <span className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          VFD Microfinance Bank
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
                        <span className={`font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Account Name:
                        </span>
                        <span className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          ohtopup
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3">
                        <span className={`font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Account Number:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold text-lg ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            1015839624
                          </span>
                          <button
                            onClick={() => copyToClipboard("1015839624")}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode
                                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                            }`}
                            title="Copy account number"
                          >
                            <FaCopy size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={`mt-6 p-4 rounded-lg ${
                      isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                    }`}>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-800'
                      }`}>
                        <strong>Important:</strong> After making the transfer, please contact our support team with your transaction reference for confirmation.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Back Button for Automated/Manual views */}
              {depositOption && (
                <div className="flex justify-center pt-3 md:pt-4">
                  <button
                    onClick={() => setDepositOption(null)}
                    className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
                      isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span>←</span>
                    <span>Back to Options</span>
                  </button>
                </div>
              )}
            </div>
          </Modal>

          <Modal
            isOpen={isWithdrawModalOpen}
            closeModal={closeWithdrawModal}
            title="Withdraw Funds"
            isDarkMode={isDarkMode}
          >
            <Withdraw
              handleShowBanks={handleShowBanks}
              closeModal={closeWithdrawModal}
              walletData={walletData}
              user={user}
              isDarkMode={isDarkMode}
              rates={rates}
              formatNairaAmount={formatNairaAmount}
              walletSettings={walletSettings}
            />
            {console.log('Passing walletSettings to Withdraw:', walletSettings)}
          </Modal>

          {/* Transaction Details Modal */}
          <Modal
            isOpen={isTransactionModalOpen}
            closeModal={() => {
              setIsTransactionModalOpen(false);
              setSelectedTransaction(null);
            }}
            title="Withdrawal Transaction Details"
            isDarkMode={isDarkMode}
          >
            {selectedTransaction && (
              <div className="space-y-6">
                {/* Transaction Header */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Transaction #{selectedTransaction.reference}
                      </h3>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {new Date(selectedTransaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Chip status={selectedTransaction.status} />
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount & Status */}
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white border'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Transaction Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          Amount:
                        </span>
                        <span className={`font-semibold text-lg ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatNairaAmount(selectedTransaction.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          Status:
                        </span>
                        <Chip status={selectedTransaction.status} />
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          Type:
                        </span>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          Withdrawal
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white border'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Bank Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          Bank Name:
                        </span>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          {selectedTransaction.bankName || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          Account Number:
                        </span>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          {selectedTransaction.accountNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          Bank Code:
                        </span>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          {selectedTransaction.bankCode || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border'
                }`}>
                  <h4 className={`font-semibold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Transaction Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedTransaction.status === 'pending' ? 'bg-yellow-500' :
                        ['approved', 'processing', 'completed'].includes(selectedTransaction.status) ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <p className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Request Submitted
                        </p>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {new Date(selectedTransaction.timestamp).toLocaleString()}
                        </p>
                        {/* Fee Information */}
                        {selectedTransaction.feeAmount > 0 && (
                          <div className={`mt-2 p-2 rounded text-xs ${
                            isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                          }`}>
                            <p className={isDarkMode ? 'text-blue-200' : 'text-blue-800'}>
                              Fee: ₦{selectedTransaction.feeAmount?.toLocaleString() || '0'} |
                              Deducted {selectedTransaction.feeDeductionMethod === 'fromWallet' ? 'from wallet' : 'from withdrawal'}
                            </p>
                            {selectedTransaction.originalAmount && selectedTransaction.originalAmount !== selectedTransaction.amount && (
                              <p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                                Original request: ₦{selectedTransaction.originalAmount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {['approved', 'processing', 'completed', 'rejected', 'failed'].includes(selectedTransaction.status) && (
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          ['approved', 'processing', 'completed'].includes(selectedTransaction.status) ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {selectedTransaction.status === 'approved' && 'Approved by Admin'}
                            {selectedTransaction.status === 'processing' && 'Processing Started'}
                            {selectedTransaction.status === 'completed' && 'Completed Successfully'}
                            {selectedTransaction.status === 'rejected' && 'Rejected by Admin'}
                            {selectedTransaction.status === 'failed' && 'Failed to Process'}
                          </p>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Status updated
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Failure/Rejection Reason */}
                {(selectedTransaction.status === 'rejected' || selectedTransaction.status === 'failed') && (
                  <div className={`p-4 rounded-lg border-l-4 ${
                    selectedTransaction.status === 'rejected'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      selectedTransaction.status === 'rejected'
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-orange-800 dark:text-orange-200'
                    }`}>
                      {selectedTransaction.status === 'rejected' ? 'Rejection Reason' : 'Failure Reason'}
                    </h4>
                    <div className={`p-3 rounded-lg ${
                      selectedTransaction.status === 'rejected'
                        ? 'bg-red-100 dark:bg-red-800/30'
                        : 'bg-orange-100 dark:bg-orange-800/30'
                    }`}>
                      <p className={`text-sm ${
                        selectedTransaction.status === 'rejected'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-orange-700 dark:text-orange-300'
                      }`}>
                        {selectedTransaction.status === 'rejected'
                          ? (selectedTransaction.rejectionReason || 'No specific reason provided.')
                          : (selectedTransaction.failureReason || 'No specific reason provided.')
                        }
                      </p>
                    </div>
                    {selectedTransaction.status === 'failed' && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Note:</strong> The withdrawal amount has been refunded to your wallet balance.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => {
                      setIsTransactionModalOpen(false);
                      setSelectedTransaction(null);
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
      {selectedCard === "Gift Points" && (
        <>
          <Gift user={user} isDarkMode={isDarkMode} />
        </>
      )}
    </>
  );
};

export default Wallet;
