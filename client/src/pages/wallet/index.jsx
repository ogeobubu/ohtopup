import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "./card";
import { FaBuilding, FaExclamationCircle } from "react-icons/fa";
import Table from "../../components/ui/table";
import Button from "../../components/ui/forms/button";
import {
  getWallet,
  getTransactions,
  getBanks,
  updateUser,
  getUser,
  depositWallet,
  verifyBankAccount,
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
import Pagination from "../../admin/components/pagination";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Import useSelector for Redux

const Wallet = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDarkMode = useSelector(state => state.theme.isDarkMode); // Get dark mode from Redux

  const [selectedCard, setSelectedCard] = useState("Naira Wallet");
  const [activeTab, setActiveTab] = useState("withdrawal");
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

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const refParam = queryParams.get("ref");
    if (refParam) {
      setRef(refParam);
    }
  }, []);

  const handleSearchChange = (e) => {
    setReference(e.target.value);
    setCurrentPage(1);
  };

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
    if (bankData) {
      const formattedBanks = bankData.data.map((bank) => ({
        value: bank.id,
        label: bank.name,
        code: bank.code,
      }));
      setBanks(formattedBanks);
    }
  }, [bankData]);

  const closeDepositModal = () => setIsDepositModalOpen(false);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (value === "") {
      setTotalAmount(0);
    } else {
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue)) {
        const fee = parsedValue * 0.015;
        setTotalAmount(parsedValue + fee);
      } else {
        setTotalAmount(0);
      }
    }
  };

  const handlePaystackSuccessAction = (reference) => {
    const data = {
      reference: reference.reference,
      userId: user?._id,
    };
    verifyTransaction(data);
  };

  const handlePaystackCloseAction = () => {};

  const handleShowBanks = () => {
    setShowBanks(!showBanks);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedBank(null);
  };

  const closeModal = () => setIsModalOpen(false);

  const openDepositModal = () => setIsDepositModalOpen(true);

  const openWithdrawModal = () => setIsWithdrawModalOpen(true);

  const closeWithdrawModal = () => setIsWithdrawModalOpen(false);

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
      setIsVerifying(false);
      setAccountName(response.data.data.account_name);
    }
  };

  const handleDeposit = async () => {
    setLoading(true); 
    try {
      const response = await depositWallet({
        userId: user?._id,
        amount: totalAmount,
        actualAmount: amount,
        customerName: user?.username,
        email: user?.email,
      });

      if (response && response.url) {
        navigate(`/wallet/${response.reference}`);
        window.open(response.url, "_blank");
      } else {
        console.error("No authorization URL returned");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error during deposit: " + error.message);
    } finally {
      setLoading(false); 
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
        queryClient.invalidateQueries(["user"]);
      } catch (error) {
        toast.error("Error adding bank account: " + error.message);
      }
    },
  });

  const columns = [
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
      header: "Bank",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.bankName}</span>
          <span className="text-gray-400 text-sm">{row.accountNumber}</span>
        </div>
      ),
    },
    { header: "Amount", render: (row) => <p>₦{row.amount.toFixed(2)}</p> },
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
    { header: "Amount", render: (row) => <p>₦{row.amount.toFixed(2)}</p> },
    { header: "Status", render: (row) => <Chip status={row.status} /> },
    {
      header: "Date",
      render: (row) => (
        <small>{new Date(row.timestamp).toLocaleString()}</small>
      ),
    },
  ];

  const formattedBalance = walletData?.balance?.toFixed(2) || "0.00";
  const [whole, decimal] = formattedBalance.split(".");

  return (
    <>
      <h1 className={`text-2xl font-bold mb-5 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Wallet</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className={`mt-5 p-4 border max-w-3xl rounded-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
              <div className="flex flex-col">
                <div className="rounded-lg w-full max-w-xs">
                  <h1 className="text-sm text-gray-500 font-bold mb-4">
                    Naira Balance
                  </h1>
                  <div className="mb-3">
                    <div>
                      <span className="text-xs text-gray-500 font-bold">₦</span>
                      <span className="text-2xl font-bold">{whole}</span>
                      <span className="text-md font-medium text-gray-500">
                        .{decimal}
                      </span>
                      {walletError && (
                        <div className="flex items-center text-red-500 mt-2">
                          <FaExclamationCircle className="mr-1" />
                          <span>{walletError.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3">
                    <div className="flex flex-col justify-center gap-1">
                      <button
                        onClick={openWithdrawModal}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center"
                      >
                        <div className="bg-blue-600 rounded-full w-6 h-6 flex justify-center items-center">
                          -
                        </div>
                      </button>
                      <span className="text-sm text-gray-600">Withdraw</span>
                    </div>
                    <div className="flex flex-col justify-center gap-1">
                      <button
                        onClick={openDepositModal}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center"
                      >
                        <div className="bg-blue-600 rounded-full w-6 h-6 flex justify-center items-center">
                          +
                        </div>
                      </button>
                      <span className="text-sm text-gray-600">Add Funds</span>
                    </div>
                    <div className="flex flex-col justify-center gap-1">
                      <button
                        onClick={handleShowBanks}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center"
                      >
                        <div className="bg-blue-600 rounded-full w-6 h-6 flex justify-center items-center">
                          <FaBuilding size={12} />
                        </div>
                      </button>
                      <span className="text-sm text-gray-600">Bank Account</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className={`flex rounded-lg border border-solid max-w-xs ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-[#F7F9FB]' } py-1 px-1`}>
                  <button
                    className={`py-1 px-1 font-medium transition-colors duration-300 ${
                      activeTab === "withdrawal"
                        ? "text-blue-500 bg-white rounded-lg w-40"
                        : "text-gray-500 hover:text-gray-800 w-40"
                    }`}
                    onClick={() => handleTabClick("withdrawal")}
                  >
                    Withdrawal
                  </button>
                  <button
                    className={`py-1 px-1 font-medium transition-colors duration-300 ${
                      activeTab === "deposit"
                        ? "text-blue-500 bg-white rounded-lg w-40"
                        : "text-gray-500 hover:text-gray-800 w-40"
                    }`}
                    onClick={() => handleTabClick("deposit")}
                  >
                    Topup
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
                      <div className="flex justify-end">
                        <input
                          type="text"
                          placeholder="Search by Reference..."
                          value={reference}
                          onChange={handleSearchChange}
                          className={`border rounded p-2 mb-3 ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300'}`}
                        />
                      </div>
                      {activeTab === "withdrawal" ? (
                        <Table
                          columns={columns}
                          data={transactionsData?.transactions}
                        />
                      ) : (
                        <Table
                          columns={topupColumns}
                          data={transactionsData?.transactions}
                        />
                      )}
                      <Pagination
                        currentPage={currentPage}
                        totalPages={transactionsData?.totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </>
                  )}
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
            title="Add Funds"
          >
            <TextField
              name="amount"
              label="Amount"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
              helperText={`Total Amount (including fees): ${totalAmount.toFixed(2)}`}
            />
            <div className="my-2">
              <Button onClick={handleDeposit} disabled={loading}>
                {loading ? "Processing..." : "Pay"}
              </Button>
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
            />
          </Modal>
        </>
      )}
      {selectedCard === "Gift Points" && (
        <>
          <Gift user={user} />
        </>
      )}
    </>
  );
};

export default Wallet;