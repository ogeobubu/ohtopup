import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllUtilityTransactions } from "../../api";
import Table from "../../components/table";
import Chip from "../../../components/ui/chip";
import Pagination from "../../components/pagination";

const Transactions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState("Electricity Bill");
  const [requestId, setRequestId] = useState("");

  const handleSearchChange = (e) => {
    setRequestId(e.target.value);
    setCurrentPage(1);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setRequestId("");
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ["transactions", currentPage, limit, activeTab, requestId],
    queryFn: () =>
      getAllUtilityTransactions(currentPage, limit, activeTab, requestId),
    keepPreviousData: true,
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">Transactions</h1>
      <div className="mb-3 flex rounded-lg border border-solid max-w-sm border-gray-300 bg-[#F7F9FB] py-1 px-1">
        <button
          className={`py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "Electricity Bill"
              ? "text-green-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("Electricity Bill")}
        >
          Electricity
        </button>
        <button
          className={`py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "TV Subscription"
              ? "text-green-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("TV Subscription")}
        >
          Cable
        </button>
        <button
          className={`py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "Data Services"
              ? "text-green-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("Data Services")}
        >
          Data
        </button>
        <button
          className={`py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "Airtime Recharge"
              ? "text-green-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("Airtime Recharge")}
        >
          Airtime
        </button>
      </div>
      <>
        {activeTab === "Electricity Bill" && (
          <>
            {isLoading && <div>Loading transactions...</div>}
            {error && (
              <div className="text-red-500">
                {error.message || "Error fetching transactions"}
              </div>
            )}
            {data && data.transactions && (
              <>
                <div className="flex justify-end">
                  <input
                    type="text"
                    placeholder="Search by RequestID..."
                    value={requestId}
                    onChange={handleSearchChange}
                    className="border border-gray-300 rounded p-2 mb-3"
                  />
                </div>

                <Table
                  columns={[
                    {
                      header: "Units",
                      render: (row) => <p>{row.units}</p>,
                    },
                    {
                      header: "Status",
                      render: (row) => <Chip status={row.status} />,
                    },
                    {
                      header: "Token",
                      render: (row) => <p>{row?.token?.split(":")[1]}</p>,
                    },
                    {
                      header: "Amount",
                      render: (row) => <p>₦{row.amount.toFixed(2)}</p>,
                    },
                    {
                      header: "Meter Number",
                      render: (row) => <p>{row.phone}</p>,
                    },
                    {
                      header: "Date",
                      render: (row) => (
                        <p>{new Date(row.createdAt).toLocaleString()}</p>
                      ),
                    },
                  ]}
                  data={data?.transactions}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={data ? data.totalPages : 0}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
        {activeTab === "TV Subscription" && (
          <>
            {isLoading && <div>Loading transactions...</div>}
            {error && (
              <div className="text-red-500">
                {error.message || "Error fetching transactions"}
              </div>
            )}
            {data && data.transactions &&  (
              <>
                <div className="flex justify-end">
                  <input
                    type="text"
                    placeholder="Search by RequestID..."
                    value={requestId}
                    onChange={handleSearchChange}
                    className="border border-gray-300 rounded p-2 mb-3"
                  />
                </div>
                <Table
                  columns={[
                    {
                      header: "Service",
                      render: (row) => (
                        <p className="text-capitalize">{row.serviceID}</p>
                      ),
                    },
                    {
                      header: "Status",
                      render: (row) => <Chip status={row.status} />,
                    },
                    {
                      header: "Amount",
                      render: (row) => <p>₦{row.amount.toFixed(2)}</p>,
                    },
                    {
                      header: "Smartcard Number",
                      render: (row) => <p>{row.phone}</p>,
                    },
                    {
                      header: "Date",
                      render: (row) => (
                        <p>{new Date(row.createdAt).toLocaleString()}</p>
                      ),
                    },
                  ]}
                  data={data?.transactions}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={data ? data.totalPages : 0}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
        {activeTab === "Data Services" && (
          <>
            {isLoading && <div>Loading transactions...</div>}
            {error && (
              <div className="text-red-500">
                {error.message || "Error fetching transactions"}
              </div>
            )}
            {data && data.transactions && (
              <>
                <div className="flex justify-end">
                  <input
                    type="text"
                    placeholder="Search by RequestID..."
                    value={requestId}
                    onChange={handleSearchChange}
                    className="border border-gray-300 rounded p-2 mb-3"
                  />
                </div>
                <Table
                  columns={[
                    {
                      header: "Product Name",
                      render: (row) => <p>{row.product_name}</p>,
                    },
                    {
                      header: "Status",
                      render: (row) => <Chip status={row.status} />,
                    },
                    {
                      header: "Amount",
                      render: (row) => <p>₦{row.amount.toFixed(2)}</p>,
                    },
                    {
                      header: "Phone Number",
                      render: (row) => <p>{row.phone}</p>,
                    },
                    {
                      header: "Date",
                      render: (row) => (
                        <p>{new Date(row.createdAt).toLocaleString()}</p>
                      ),
                    },
                  ]}
                  data={data?.transactions}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={data ? data.totalPages : 0}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
        {activeTab === "Airtime Recharge" && (
          <>
            {isLoading && <div>Loading transactions...</div>}
            {error && (
              <div className="text-red-500">
                {error.message || "Error fetching transactions"}
              </div>
            )}
            {data && data.transactions && (
              <>
                <div className="flex justify-end">
                  <input
                    type="text"
                    placeholder="Search by RequestID..."
                    value={requestId}
                    onChange={handleSearchChange}
                    className="border border-gray-300 rounded p-2 mb-3"
                  />
                </div>
                <Table
                  columns={[
                    {
                      header: "Product Name",
                      render: (row) => <p className="text-sm">{row.product_name}</p>,
                    },
                    {
                      header: "Status",
                      render: (row) => <Chip status={row.status} />,
                    },
                    {
                      header: "Amount",
                      render: (row) => <p>₦{row.amount.toFixed(2)}</p>,
                    },
                    {
                      header: "Phone Number",
                      render: (row) => <p>{row.phone}</p>,
                    },
                    {
                      header: "Date",
                      render: (row) => (
                        <p>{new Date(row.createdAt).toLocaleString()}</p>
                      ),
                    },
                  ]}
                  data={data?.transactions}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={data ? data.totalPages : 0}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
      </>
    </div>
  );
};

export default Transactions;
