import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getAllUtilityTransactions } from "../../api";
import DataTable from "../../components/dataTable";
import ModernPagination from "../../components/modernPagination";
import Chip from "../../components/ui/chip";
import { useSelector } from "react-redux";
import { formatNairaAmount } from "../../utils";
import { FaEye } from "react-icons/fa";

const Transactions = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState("Data Services");
  const [requestId, setRequestId] = useState("");
  const isDarkMode = useSelector((state) => state.theme && state.theme.isDarkMode);

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
  });

  const totalPages = data ? data.totalPages : 0;
  const transactions = data?.transactions ?? [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderTableContent = () => {
    const commonColumns = [
      {
        header: "Status",
        render: (row) => <Chip status={row.status} />,
      },
      {
        header: "Amount",
        render: (row) => <p className="font-semibold text-green-600 dark:text-green-400">{formatNairaAmount(row.amount)}</p>,
      },
      {
        header: "Date",
        render: (row) => (
          <p className="text-xs md:text-sm">
            {window.innerWidth < 768
              ? new Date(row.createdAt).toLocaleDateString()
              : new Date(row.createdAt).toLocaleString()
            }
          </p>
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
            render: (row) => <p className="text-xs font-mono">{row?.token?.split(":")[1]}</p>,
          },
          {
            header: window.innerWidth < 768 ? "Meter #" : "Meter Number",
            render: (row) => <p className="text-xs md:text-sm font-mono">{row.phone}</p>,
          },
        ];
        break;
      case "TV Subscription":
        specificColumns = [
          {
            header: "Service",
            render: (row) => <p className="text-capitalize text-xs md:text-sm">{row.serviceID}</p>,
          },
          {
            header: window.innerWidth < 768 ? "Card #" : "Smartcard Number",
            render: (row) => <p className="text-xs md:text-sm font-mono">{row.phone}</p>,
          },
        ];
        break;
      case "Data Services":
        specificColumns = [
          {
            header: window.innerWidth < 768 ? "Product" : "Product Name",
            render: (row) => (
              <p className="text-xs md:text-sm truncate max-w-24 md:max-w-none" title={row.product_name}>
                {row.product_name}
              </p>
            ),
          },
          {
            header: window.innerWidth < 768 ? "Phone" : "Phone Number",
            render: (row) => <p className="text-xs md:text-sm font-mono">{row.phone}</p>,
          },
        ];
        break;
      case "Airtime Recharge":
        specificColumns = [
          {
            header: window.innerWidth < 768 ? "Product" : "Product Name",
            render: (row) => (
              <p className="text-xs md:text-sm truncate max-w-24 md:max-w-none" title={row.product_name}>
                {row.product_name}
              </p>
            ),
          },
          {
            header: window.innerWidth < 768 ? "Phone" : "Phone Number",
            render: (row) => <p className="text-xs md:text-sm font-mono">{row.phone}</p>,
          },
        ];
        break;
      default:
        break;
    }

    const actionsColumn = [
      {
        header: "Actions",
        render: (row) => (
          <button
            onClick={() => navigate(`/transactions/${row.requestId}`)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="View Details"
          >
            <FaEye />
          </button>
        ),
      },
    ];

    const columns = [...commonColumns, ...specificColumns, ...actionsColumn];

    return (
      <>
        <div className="flex flex-col sm:flex-row justify-start sm:justify-end items-stretch sm:items-center mb-3 gap-2">
          <input
            type="text"
            placeholder="Search by RequestID..."
            value={requestId}
            onChange={handleSearchChange}
            className={`border border-gray-300 rounded-md px-3 py-2 w-full sm:w-64 text-sm ${
              isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
            }`}
          />
        </div>
        <div className="overflow-x-auto">
          <DataTable columns={columns} data={transactions} />
        </div>
        <ModernPagination
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
      } p-2 md:p-4`}
    >
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-5">Transactions</h1>
      <div
        className={`mb-3 flex flex-wrap md:flex-row flex-col rounded-lg border border-solid w-full max-w-sm md:max-w-md ${
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
            className={`flex-1 py-2 mx-1 font-medium text-sm transition-colors duration-300 ${
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
