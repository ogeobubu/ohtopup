import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getAllUtilityTransactions, requeryTransaction } from "../../api";
import TransactionTable from "../../components/transactionTable";
import ModernPagination from "../../components/modernPagination";
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
    <div>
      <div className="mb-6 min-w-0"><div><h1>Transactions</h1><p>Review utility payments and follow up on their status.</p></div></div>
      <div className="flex min-h-11 flex-wrap items-stretch justify-between border-b border-line" role="group" aria-label="Transaction services">
        {[
          "Data Services",
          "Airtime Recharge",
          "Electricity Bill",
          "TV Subscription",
        ].map((tab) => (
          <button
            key={tab}
            aria-pressed={activeTab === tab}
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
                placeholder="Search by reference…"
                aria-label="Search transactions by reference"
                value={requestId}
                onChange={handleSearchChange}
                className="block min-h-[46px] w-full rounded-[5px] border border-line bg-paper px-3 py-2.5 text-sm text-ink max-w-xs"
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
