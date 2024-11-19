import React, { useState } from "react";
import { useSelector } from "react-redux"
import Card from "./card";
import { FaWallet, FaMoneyBillAlt, FaBuilding } from "react-icons/fa";
import Table from "../../components/ui/table";
import Button from "../../components/ui/forms/button";
import { depositWallet, createDedicatedAccount } from "../../api";
import Modal from "../../admin/components/modal";
import { toast } from "react-toastify";

const Wallet = () => {
  const user = useSelector(state => state.user.user)
  const [selectedCard, setSelectedCard] = useState("Naira Wallet");
  const [activeTab, setActiveTab] = useState("Withdrawals");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleCardClick = (title) => {
    setSelectedCard(title);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const columns = [
    { header: "Bank", render: (row) => <p>{row.bank}</p> },
    { header: "Amount", render: (row) => <p>₦{row.amount.toFixed(2)}</p> },
    { header: "Status", render: (row) => <p>{row.status}</p> },
    { header: "Date", render: (row) => <small>{row.date}</small> },
  ];

  const topupColumns = [
    { header: "Method", render: (row) => <p>{row.method}</p> },
    { header: "Amount", render: (row) => <p>₦{row.amount.toFixed(2)}</p> },
    { header: "Status", render: (row) => <p>{row.status}</p> },
    { header: "Date", render: (row) => <small>{row.date}</small> },
  ];

  const topupData = [
    {
      method: "Mobile Money",
      amount: 25.0,
      status: "Completed",
      date: "2023-05-05",
    },
  ];

  const withdrawalData = [
    {
      bank: "Access Bank",
      amount: 50.0,
      status: "Completed",
      date: "2023-05-01",
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold mb-5">Wallet</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Naira Wallet"
          balance={100}
          color="blue"
          onClick={() => handleCardClick("Naira Wallet")}
          isActive={selectedCard === "Naira Wallet"}
        />
        <Card
          title="Cedis Wallet"
          balance={50}
          color="red"
          onClick={() => handleCardClick("Cedis Wallet")}
          isActive={selectedCard === "Cedis Wallet"}
        />
        <Card
          title="Gift Points"
          balance={500}
          color="green"
          onClick={() => handleCardClick("Gift Points")}
          isActive={selectedCard === "Gift Points"}
        />
      </div>
      {selectedCard === "Naira Wallet" && (
        <>
          <div className="mt-5 p-4 border max-w-2xl rounded-sm">
            <div className="flex flex-col">
              <div className="rounded-lg w-full max-w-xs">
                <h1 className="text-sm text-gray-500 font-bold mb-4">
                  Naira Balance
                </h1>
                <div className="mb-3">
                  <div>
                    <span className="text-xs text-gray-500 font-bold">₦</span>
                    <span className="text-2xl font-bold">98</span>
                    <span className="text-md font-medium text-gray-500">
                      .50
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="flex flex-col justify-center gap-1">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center">
                      <div className="bg-blue-600 rounded-full w-6 h-6 flex justify-center items-center">
                        -
                      </div>
                    </button>
                    <span className="text-sm text-gray-600">Withdraw</span>
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center"
                      onClick={openModal} // Open modal on click
                    >
                      <div className="bg-blue-600 rounded-full w-6 h-6 flex justify-center items-center">
                        +
                      </div>
                    </button>
                    <span className="text-sm text-gray-600">Add Funds</span>
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center">
                      <div className="bg-blue-600 rounded-full w-6 h-6 flex justify-center items-center">
                        <FaBuilding
                          size={12}
                          className="flex justify-center items-center"
                        />
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
                    activeTab === "Withdrawals"
                      ? "text-blue-500 bg-white rounded-lg w-40"
                      : "text-gray-500 hover:text-gray-800 w-40"
                  }`}
                  onClick={() => handleTabClick("Withdrawals")}
                >
                  Withdrawals
                </button>
                <button
                  className={`py-1 px-1 font-medium transition-colors duration-300 ${
                    activeTab === "Topup"
                      ? "text-blue-500 bg-white rounded-lg w-40"
                      : "text-gray-500 hover:text-gray-800 w-40"
                  }`}
                  onClick={() => handleTabClick("Topup")}
                >
                  Topup
                </button>
              </div>
              <div className="mt-6">
                {activeTab === "Withdrawals" && (
                  <Table columns={columns} data={withdrawalData} />
                )}
                {activeTab === "Topup" && (
                  <Table columns={topupColumns} data={topupData} />
                )}
              </div>
            </div>
          </div>

          <Modal isOpen={isModalOpen} closeModal={closeModal} title="Add Funds">
            <>
              <Button
                onClick={async () => {
                  try {
                    const response = await createDedicatedAccount({
                      email: user?.email,
                    });
                    toast.success(response.data.message);
                  } catch (error) {
                    toast.error(error.response.data.message);
                  }
                }}
              >
                Create Virtual Account
              </Button>
              {/* <div className="bg-blue-500 text-white rounded-lg p-6 max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold">Account Number</h2>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => navigator.clipboard.writeText("1036139923")}
                >
                  Copy
                </button>
              </div>
              <p className="font-bold text-xl mb-2">1036139923</p>
              <p className="font-bold mb-1">VFD MICROFINANCE BANK</p>
              <p className="font-bold">ANDRETI OBUBU</p>
            </div>
            <div className="bg-white text-blue-500 rounded-lg p-4">
              <ul className="space-y-1">
                <li>
                  <span className="font-bold">Note:</span>
                  <div>Every top-up attracts a 1.5% fee.</div>
                </li>
                <li>
                  <span className="font-bold">Note:</span>
                  <div>
                    This virtual account may be deactivated if you send funds
                    from an account that is not attached to your BVN.
                  </div>
                </li>
                <li>
                  <span className="font-bold">Note:</span>
                  <div>
                    This account is only provided so you can fund your wallet to
                    make a purchase on Prestmit.
                  </div>
                </li>
              </ul>
            </div> */}
            </>
          </Modal>
        </>
      )}
    </>
  );
};

export default Wallet;
