import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllUtilityTransactions } from "../../api";
import Table from "../../components/ui/table";
import Chip from "../../components/ui/chip";
import Pagination from "../../admin/components/pagination";
import { useSelector } from "react-redux";
import { formatNairaAmount } from "../../utils";

const Transactions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState("Data Services");
  const [requestId, setRequestId] = useState("");
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

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

  const totalPages = data ? data.totalPages : 0;
  const transactions = data?.transactions ?? [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderTableContent = () => {
    const commonColumns = [
      {
        header: "ID",
        render: (row) => (
          <p
            title={row.requestId}
            className="w-full whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {row.requestId.length > 10
              ? `${row.requestId.slice(0, 15)}...`
              : row.requestId}
          </p>
        ),
      },
      {
        header: "Status",
        render: (row) => <Chip status={row.status} />,
      },
      {
        header: "Amount",
        render: (row) => <p>{formatNairaAmount(row.amount)}</p>,
      },
      {
        header: "Date",
        render: (row) => <p>{new Date(row.createdAt).toLocaleString()}</p>,
      },
    ];

    let specificColumns = [];
    switch (activeTab) {
      case "Electricity Bill":
        specificColumns = [
          {
            header: "Units",
            render: (row) => <p>{row.units}</p>,
          },
          {
            header: "Token",
            render: (row) => <p>{row?.token?.split(":")[1]}</p>,
          },
          {
            header: "Meter Number",
            render: (row) => <p>{row.phone}</p>,
          },
        ];
        break;
      case "TV Subscription":
        specificColumns = [
          {
            header: "Service",
            render: (row) => <p className="text-capitalize">{row.serviceID}</p>,
          },
          {
            header: "Smartcard Number",
            render: (row) => <p>{row.phone}</p>,
          },
        ];
        break;
      case "Data Services":
        specificColumns = [
          {
            header: "Product Name",
            render: (row) => <p>{row.product_name}</p>,
          },
          {
            header: "Phone Number",
            render: (row) => <p>{row.phone}</p>,
          },
        ];
        break;
      case "Airtime Recharge":
        specificColumns = [
          {
            header: "Product Name",
            render: (row) => <p>{row.product_name}</p>,
          },
          {
            header: "Phone Number",
            render: (row) => <p>{row.phone}</p>,
          },
        ];
        break;
      default:
        break;
    }

    const columns = [...commonColumns, ...specificColumns];

    return (
      <>
        <div className="flex flex-col sm:flex-row justify-end items-center mb-3">
          <input
            type="text"
            placeholder="Search by RequestID..."
            value={requestId}
            onChange={handleSearchChange}
            className={`border border-gray-300 rounded p-2 w-full sm:w-64 ${
              isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
            }`}
          />
        </div>
        <div className="overflow-x-auto">
          <Table columns={columns} data={transactions} />
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </>
    );
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
      } md:p-4`}
    >
      <h1 className="text-2xl font-bold mb-5">Transactions</h1>
      <div
        className={`mb-3 flex flex-wrap md:flex-row flex-col rounded-lg border border-solid max-w-sm ${
          isDarkMode
            ? "border-gray-600 bg-gray-800"
            : "border-gray-300 bg-[#F7F9FB]"
        } py-1 px-1`}
      >
        {[
          "Data Services",
          "Airtime Recharge",
          "Electricity Bill",
          "TV Subscription",
        ].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-1 mx-1 font-medium transition-colors duration-300 ${
              activeTab === tab
                ? "text-blue-500 bg-white rounded-lg"
                : "text-gray-500 hover:text-gray-800"
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
        {data && renderTableContent()}
      </>
    </div>
  );
};

export default Transactions;
