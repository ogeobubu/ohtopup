import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "./card";
import { FaWallet, FaMoneyBillAlt, FaBuilding, FaExclamationCircle } from "react-icons/fa";
import Table from "../../components/ui/table";
import Button from "../../components/ui/forms/button";
import { getWallet, getTransactions, getBanks, updateUser, getUser } from "../../api";
import Modal from "../../admin/components/modal";
import { toast } from "react-toastify";
import Chip from "../../components/ui/chip";
import TextField from "../../components/ui/forms/input";
import Select from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import Banks from "./banks";
import Withdraw from "./withdraw";

const Wallet = () => {
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState("Naira Wallet");
  const [activeTab, setActiveTab] = useState("withdrawal");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [banks, setBanks] = useState([]);
  const [showBanks, setShowBanks] = useState(false);

  const { data: walletData, error: walletError, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });

  const { data: transactionsData, error: transactionsError, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", activeTab],
    queryFn: () => getTransactions(activeTab.toLowerCase()),
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
      }));
      setBanks(formattedBanks);
    }
  }, [bankData]);

  const handleShowBanks = () => {
    setShowBanks(!showBanks);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedBank(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openWithdrawModal = () => {
    setIsWithdrawModalOpen(true);
  };

  const closeWithdrawModal = () => {
    setIsWithdrawModalOpen(false);
  };

  const validationSchema = Yup.object().shape({
    accountNumber: Yup.string()
      .required("Account number is required")
      .matches(/^\d{10}$/, "Account number must be 10 digits"),
  });

  const formik = useFormik({
    initialValues: { accountNumber: "" },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await updateUser({
          bankAccount: {
            bankName: selectedBank?.label,
            accountNumber: values.accountNumber,
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
    { header: "Bank", render: (row) => <div className="flex flex-col"><span>{row.bankName}</span><span className="text-gray-400 text-sm">{row.accountNumber}</span></div> },
    { header: "Amount", render: (row) => <p>₦{row.amount.toFixed(2)}</p> },
    { header: "Status", render: (row) => <Chip status={row.status} /> },
    { header: "Date", render: (row) => <small>{new Date(row.timestamp).toLocaleString()}</small> },
  ];

  const topupColumns = [
    { header: "Type", render: (row) => <p>{row.type}</p> },
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
      <h1 className="text-2xl font-bold mb-5">Wallet</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Naira Wallet"
          balance={walletData?.balance}
          color="blue"
          onClick={() => setSelectedCard("Naira Wallet")}
          isActive={selectedCard === "Naira Wallet"}
        />
        <Card
          title="Cedis Wallet"
          balance={50}
          color="red"
          onClick={() => setSelectedCard("Cedis Wallet")}
          isActive={selectedCard === "Cedis Wallet"}
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
            <Banks user={user} handleShowBanks={handleShowBanks} openModal={openModal} />
          ) : (
            <div className="mt-5 p-4 border max-w-2xl rounded-sm">
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
                      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center">
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
                          <FaBuilding size={12} className="flex justify-center items-center" />
                        </div>
                      </button>
                      <span className="text-sm text-gray-600">Bank Account</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex rounded-lg border border-solid max-w-xs border-gray-300 bg-[#F7F9FB] py-1 px-1">
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
                    <p>Error fetching transactions: {transactionsError.message}</p>
                  ) : activeTab === "withdrawal" ? (
                    <Table columns={columns} data={transactionsData} />
                  ) : (
                    <Table columns={topupColumns} data={transactionsData} />
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
            <form onSubmit={formik.handleSubmit} className="p-4">
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
                onChange={formik.handleChange}
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
              <Button type="submit" disabled={!selectedBank}>
                Add Bank Account
              </Button>
            </form>
          </Modal>

          <Modal
            isOpen={isWithdrawModalOpen}
            closeModal={closeWithdrawModal}
            title="Withdraw Funds"
          >
            <Withdraw handleShowBanks={handleShowBanks} closeModal={closeWithdrawModal} walletData={walletData} user={user} />
          </Modal>
        </>
      )}
    </>
  );
};

export default Wallet;