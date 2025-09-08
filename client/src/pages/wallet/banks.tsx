import React, { useState } from "react";
import { FaBuilding } from "react-icons/fa";
import Modal from "../../admin/components/modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getUser, deleteBank } from "../../api";
import { toast } from "react-toastify";

// TypeScript interfaces
interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
}

interface User {
  _id: string;
  email: string;
  bankAccounts?: BankAccount[];
}

interface BanksProps {
  user: User;
  handleShowBanks: () => void;
  openModal: () => void;
}

const Banks: React.FC<BanksProps> = ({ user, handleShowBanks, openModal }) => {
  const queryClient = useQueryClient();
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const openDeleteModal = (data) => {
    setIsDeleteModalOpen(true);
    setSelectedBank(data);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedBank(null);
  };

  const deleteBankMutation = useMutation({
    mutationFn: async (accountNumber) => {
      await deleteBank(accountNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Bank account deleted successfully!");
      closeDeleteModal();
    },
    onError: (error) => {
      console.error("Failed to delete bank account:", error);
      toast.error("Failed to delete bank account.");
    },
  });

  const handleDeleteBank = () => {
    if (selectedBank) {
      deleteBankMutation.mutate(selectedBank.accountNumber);
    }
  };

  return (
    <div className="p-4 border border-solid border-gray-200 mt-5 max-w-3xl rounded-sm">
      <div
        className="flex items-center cursor-pointer"
        onClick={handleShowBanks}
      >
        <FaBuilding className="text-blue-500 mr-2" />
        <span className="text-blue-600 hover:underline">Go Bank</span>
      </div>

      <h1 className="text-2xl font-bold my-3">Manage Accounts</h1>

      <div className="mt-5 flex flex-wrap gap-3">
        <div
          onClick={openModal}
          className="flex border-2 border-dashed border-blue-500 w-full sm:w-[400px] shadow-md justify-center items-center flex-col cursor-pointer rounded-md"
        >
          <span className="text-4xl text-blue-500">+</span>
          <span className="text-blue-600 hover:underline">
            Add Bank Account
          </span>
        </div>

        {user?.bankAccounts &&
          user?.bankAccounts.map((account, index) => (
            <div
              key={index}
              className="bg-[#0B2253] rounded-md p-4 w-full sm:w-[400px] shadow-md"
            >
              <div
                onClick={() => openDeleteModal(account)}
                className="flex flex-col cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#415379] flex justify-between items-center mb-5">
                  <FaBuilding
                    size={15}
                    className="flex justify-between items-center text-white w-full"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white text-2xl font-bold">
                    {account?.accountNumber}
                  </span>
                  <span className="text-white text-xs font-medium">
                    Account Number
                  </span>
                </div>

                <div className="ml-auto">
                  <span className="text-white text-xs font-medium">
                  <span
                        title={account?.accountName}
                        className="w-full whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        {account?.accountName &&
                        account?.accountName.length > 10
                          ? `${account?.accountName.slice(0, 15)}...`
                          : account?.accountName}
                      </span> {account?.bankName}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        closeModal={closeDeleteModal}
        title="My Bank Account"
      >
        {deleteModal ? (
          <div className="p-2 flex flex-col space-y-3">
            <h1 className="font-semibold text-xl">Warning</h1>
            <p>Are you sure you want to delete this bank account?</p>
            <div className="flex gap-3 items-center ml-auto w-full">
              <button
                className="text-gray-300"
                onClick={() => setDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="text-[#0B2253] font-semibold"
                onClick={handleDeleteBank}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="bg-[#0B2253] rounded-md p-4 w-full sm:w-[400px] shadow-md backdrop-blur-[12px]">
                <div className="flex flex-col cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-[#415379] flex justify-between items-center mb-5">
                    <FaBuilding
                      size={15}
                      className="flex justify-between items-center text-white w-full"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white text-2xl font-bold">
                      {selectedBank?.accountNumber}
                    </span>
                    <span className="text-white text-xs font-medium">
                      Account Number
                    </span>
                  </div>
                  <div className="ml-auto">
                    <span className="text-white text-xs font-medium">
                      <span
                        title={selectedBank?.accountName}
                        className="w-full whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        {selectedBank?.accountName &&
                        selectedBank?.accountName.length > 10
                          ? `${selectedBank?.accountName.slice(0, 15)}...`
                          : selectedBank?.accountName}
                      </span>{" "}
                      {selectedBank?.bankName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-[5px] rounded-md"></div>
            </div>
            <div className="flex flex-col mt-5 gap-1">
              <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-1">
                <p>Account Number</p>
                <p>{selectedBank?.accountNumber}</p>
              </div>
              <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-1">
                <p>Account Name</p>
                <p>{selectedBank?.bankName}</p>
              </div>
              <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-1">
                <p>Wallet Type</p>
                <p>Naira Wallet</p>
              </div>
              <button
                onClick={() => setDeleteModal(true)}
                className="text-red-600 mr-auto mt-5"
              >
                Delete Bank
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Banks;
