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
} from "../../api";
import Textfield from "../../../components/ui/forms/input";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Chip from "../../../components/ui/chip";
import Card from "./card";
import Pagination from "../../components/pagination";
import Select from "react-select";

const AdminWalletManagement = () => {
  const users = useSelector((state) => state.admin.users);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [activeTab, setActiveTab] = useState("Wallets");
  const [loadingTransaction, setLoadingTransaction] = useState(false); // Loading state for transactions

  // Pagination state for transactions
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10; // Set your desired limit per page

  // State for filters
  const [transactionType, setTransactionType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: wallets,
    isLoading: loadingWallets,
    error: walletError,
    refetch: refetchWallets,
  } = useQuery({
    queryKey: ["wallets"],
    queryFn: getWallets,
  });

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
      setCurrentPage(1); // Reset to first page on tab change
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

  const handleAddFunds = async (amount, resetForm) => {
    if (selectedUser) {
      setLoadingTransaction(true);
      try {
        await depositWallet(selectedUser.userId, parseFloat(amount));
        toast.success(
          `Successfully added ₦${amount} to ${selectedUser.username}'s wallet.`
        );
        resetForm();
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
          count={`₦${wallets?.totalBalance ? wallets?.totalBalance?.toFixed(2) : 0.00}`}
          icon={FaMoneyBill}
          bgColor="bg-blue-200"
        />
      </div>

      <div className="mb-3 flex rounded-lg border border-solid max-w-xs border-gray-300 bg-[#F7F9FB] py-1 px-1">
        <button
          className={`py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "Wallets"
              ? "text-blue-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("Wallets")}
        >
          Wallets
        </button>
        <button
          className={`py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "Transactions"
              ? "text-blue-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("Transactions")}
        >
          Transactions
        </button>
      </div>

      {activeTab === "Wallets" && (
        <div className="overflow-x-auto">
          <Table
            columns={[
              { header: "User", render: (row) => <p>{row.username}</p> },
              {
                header: "Wallet Balance",
                render: (row) => <p>₦{row?.balance?.toFixed(2) || "0.00"}</p>,
              },
              {
                header: "Actions",
                render: (row) => (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleWallet(row._id, row.isActive)}
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
            data={wallets?.data}
          />
        </div>
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
                    render: (row) => <p>₦{row.amount.toFixed(2)}</p>,
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
          {({ errors, touched }) => (
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
                    min="0"
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
                className={`bg-blue-500 hover:bg-blue-600 text-white mt-3 ${loadingTransaction ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={loadingTransaction} // Disable if loading
              >
                {isCreatingWallet ? "Create Wallet" : "Add Funds"}
              </Button>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  );
};

export default AdminWalletManagement;