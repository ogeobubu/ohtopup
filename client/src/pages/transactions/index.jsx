import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllUtilityTransactions } from "../../api";
import Table from "../../components/ui/table";
import Chip from "../../components/ui/chip";
import Pagination from "../../admin/components/pagination";

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
        render: (row) => <p>₦{row.amount.toFixed(2)}</p>,
      },
      {
        header: "Date",
        render: (row) => (
          <p>{new Date(row.createdAt).toLocaleString()}</p>
        ),
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
        <div className="flex flex-col sm:flex-row justify-between items-center mb-3 px-2">
          <input
            type="text"
            placeholder="Search by RequestID..."
            value={requestId}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded p-2 w-full sm:w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <Table columns={columns} data={data?.transactions} />
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={data ? data.totalPages : 0}
          onPageChange={handlePageChange}
        />
      </>
    );
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-5">Transactions</h1>
      <div className="mb-3 flex overflow-x-auto space-x-2 sm:space-x-3 rounded-lg border border-gray-300 bg-[#F7F9FB] py-1 px-2 sm:px-4">
        {["Electricity Bill", "TV Subscription", "Data Services", "Airtime Recharge"].map((tab) => (
          <button
            key={tab}
            className={`py-1 px-3 font-medium transition-colors duration-300 ${
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
        {data && (
          renderTableContent()
        )}
      </>
    </div>
  );
};

export default Transactions;
