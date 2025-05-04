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
      <h1 className="text-2xl font-bold mb-5">Admin Wallet Management</h1>
      <div className="mb-3">
        <Card
          title="Total Balance"
          count={formatNairaAmount(wallets?.totalWalletAmount)}
          icon={FaMoneyBill}
          bgColor="bg-blue-200"
        />
      </div>

      <div className="mb-3 flex md:flex-row flex-col rounded-lg border border-solid max-w-xs border-gray-300 bg-[#F7F9FB] py-1 px-1">
        <button
          className={`md:w-40 w-full py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "Wallets"
              ? "text-blue-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("Wallets")}
        >
          Wallets
        </button>
        <button
          className={`md:w-40 w-full py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "Transactions"
              ? "text-blue-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("Transactions")}
        >
          Transactions
        </button>
      </div>

      <div className="w-full flex justify-end mb-4">
        <button
          onClick={openRate}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Set Rate
        </button>
      </div>

      {activeTab === "Wallets" && (
        <>
          <div className="overflow-x-auto">
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleToggleWallet(row._id, row.isActive)
                        }
                        className={`flex justify-center items-center rounded-full border border-solid w-6 h-6 ${
                          row.isActive ? "border-green-500" : "border-red-500"
                        } text-blue-500`}
                      >
                        {row.isActive ? (
                          <FaToggleOn className="text-green-500" size={15} />
                        ) : (
                          <FaToggleOff className="text-red-500" size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => openModal(row)}
                        className="border border-solid border-green-500 flex justify-center items-center rounded-full w-6 h-6 text-green-500 hover:text-green-700"
                      >
                        <FaWallet size={15} />
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
        <div className="overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <Select
              options={transactionTypeOptions}
              onChange={(selectedOption) => {
                setTransactionType(selectedOption?.value || null);
                setCurrentPage(1);
              }}
              placeholder="Select Type"
              className="w-48 mr-4"
            />
            <Textfield
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1"
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

      <Modal
        isOpen={isModalOpen}
        closeModal={closeModal}
        title={
          isCreatingWallet
            ? `Create Wallet for ${selectedUser?.username}`
            : `Add Funds to ${selectedUser?.username}`
        }
      >
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
            <Form className="flex flex-col">
              {!isCreatingWallet ? (
                <>
                  <label htmlFor="amount" className="mb-1">
                    Enter Amount:
                  </label>
                  <Field
                    name="amount"
                    as={Textfield}
                    placeholder="₦0.00"
                    value={formattedAmount}
                    onChange={(e) => handleAmountChange(e, setFieldValue)}
                  />
                  {errors.amount && touched.amount ? (
                    <div className="text-red-600 text-sm">{errors.amount}</div>
                  ) : null}
                </>
              ) : (
                <p>
                  Are you sure you want to create a wallet for{" "}
                  {selectedUser?.username}?
                </p>
              )}
              <Button
                type="submit"
                className={`bg-blue-500 hover:bg-blue-600 text-white mt-3 ${
                  loadingTransaction ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loadingTransaction}
              >
                {isCreatingWallet ? "Create Wallet" : "Add Funds"}
              </Button>
            </Form>
          )}
        </Formik>
      </Modal>

      <Modal isOpen={isRateOpen} closeModal={closeRate} title={`Set Rates`}>
        {loadingRates ? (
          <p>Loading current rates...</p>
        ) : ratesError ? (
          <p>Error fetching rates: {ratesError.message}</p>
        ) : (
          <div className="mb-4">
            <p>
              Current Withdrawal Rate:{" "}
              {formatNairaAmount(rates?.withdrawalRate)}
            </p>
            <p>Current Deposit Rate: {rates?.depositRate}%</p>
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
            <Form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1">Withdrawal Rate:</label>
                <Field
                  name="withdrawalRate"
                  as={Textfield}
                  placeholder="Enter withdrawal rate"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Deposit Rate:</label>
                <Field
                  name="depositRate"
                  as={Textfield}
                  placeholder="Enter deposit rate"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeRate}
                  className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  );
};

export default AdminWalletManagement;
