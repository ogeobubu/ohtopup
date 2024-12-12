import React, { useState } from "react";
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
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-5 text-gray-800 dark:text-gray-200">
        Transactions
      </h1>
      <div className="mb-3 flex md:flex-row flex-col rounded-lg border border-solid max-w-sm border-gray-300 dark:border-gray-600 bg-[#F7F9FB] dark:bg-gray-700 py-1 px-1">
        {[
          "Electricity Bill",
          "TV Subscription",
          "Data Services",
          "Airtime Recharge",
        ].map((tab) => (
          <button
            key={tab}
            className={`py-1 px-1 md:w-40 w-full font-medium transition-colors duration-300 ${
              activeTab === tab
                ? "text-green-500 bg-white rounded-lg w-40 dark:bg-gray-600 dark:text-white"
                : "text-gray-500 hover:text-gray-800 w-40 dark:text-gray-400 hover:dark:text-gray-200"
            }`}
            onClick={() => handleTabClick(tab)}
          >
            {tab.split(" ")[0]}
          </button>
        ))}
      </div>
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
                className="border border-gray-300 rounded-md p-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white mb-3"
              />
            </div>
            <div className="overflow-x-auto">
              <Table
                columns={
                  activeTab === "Electricity Bill"
                    ? [
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
                      ]
                    : activeTab === "TV Subscription"
                    ? [
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
                      ]
                    : activeTab === "Data Services"
                    ? [
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
                      ]
                    : [
                        {
                          header: "Product Name",
                          render: (row) => (
                            <p className="text-sm">{row.product_name}</p>
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
                          header: "Phone Number",
                          render: (row) => <p>{row.phone}</p>,
                        },
                        {
                          header: "Date",
                          render: (row) => (
                            <p>{new Date(row.createdAt).toLocaleString()}</p>
                          ),
                        },
                      ]
                }
                data={data.transactions}
              />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </>
    </div>
  );
};

export default Transactions;
