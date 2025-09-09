import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getAllUtilityTransactions, requeryTransaction } from "../../api";
import TransactionTable from "../../../components/transactionTable";
import ModernPagination from "../../../components/modernPagination";
import { toast } from "react-toastify";

const Transactions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState("Data Services");
  const [requestId, setRequestId] = useState("");
  const [userId, setUserId] = useState("");
  const [searchParams] = useSearchParams();

  // Get userId from URL parameters
  useEffect(() => {
    const userIdParam = searchParams.get('userId');
    if (userIdParam) {
      setUserId(userIdParam);
      setActiveTab("Electricity Bill"); // Default to electricity when viewing user transactions
    }
  }, [searchParams]);

  const handleSearchChange = (e) => {
    setRequestId(e.target.value);
    setCurrentPage(1);
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ["transactions", currentPage, limit, activeTab, requestId, userId],
    queryFn: () =>
      getAllUtilityTransactions(currentPage, limit, activeTab, requestId, userId),
  });

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setRequestId("");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRequery = async (requestId) => {
    try {
      await requeryTransaction({ request_id: requestId });
      toast.success("Requery successful for Request ID: " + requestId);
    } catch (error) {
      toast.error("Requery failed: " + error.message);
    }
  };

  return (
    <div className="p-2 md:p-4 space-y-3 md:space-y-4">
      <h1 className="text-lg md:text-2xl font-bold mb-3 md:mb-5 text-gray-800 dark:text-gray-200">
        Transactions
      </h1>
      <div className="mb-3 flex flex-wrap rounded-lg border border-solid w-full max-w-sm md:max-w-none border-gray-300 dark:border-gray-600 bg-[#F7F9FB] dark:bg-gray-700 py-1 px-1">
        {[
          "Data Services",
          "Airtime Recharge",
          "Electricity Bill",
          "TV Subscription",
        ].map((tab) => (
          <button
            key={tab}
            className={`py-2 px-2 flex-1 md:flex-none md:w-40 font-medium text-xs md:text-sm transition-colors duration-300 ${
              activeTab === tab
                ? "text-green-500 bg-white rounded-lg dark:bg-gray-600 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 hover:dark:text-gray-200"
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
            <div className="flex justify-start md:justify-end mb-3">
              <input
                type="text"
                placeholder="Search by RequestID..."
                value={requestId}
                onChange={handleSearchChange}
                className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <TransactionTable
              data={data.transactions}
              onRequery={handleRequery}
            />
            <ModernPagination
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
