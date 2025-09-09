import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaSearch,
  FaEye,
  FaExclamationTriangle,
  FaInfo,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaServer,
  FaGamepad,
  FaShieldAlt,
  FaShoppingCart,
  FaEnvelope,
  FaUserShield,
  FaCreditCard,
  FaSync
} from "react-icons/fa";
import Select from "react-select";
import Table from "../../components/table";
import Pagination from "../../components/pagination";
import { getSystemLogs, getLogStats, cleanupLogs } from "../../api";
import { toast } from "react-toastify";

const SystemLogs = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [dateRange, setDateRange] = useState("24h");

  const { data: logsData, isLoading: isLogsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["systemLogs", currentPage, searchTerm, levelFilter, categoryFilter, dateRange],
    queryFn: () =>
      getSystemLogs({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        level: levelFilter?.value,
        category: categoryFilter?.value,
        dateRange
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["logStats"],
    queryFn: getLogStats,
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleLevelFilterChange = (selectedOption) => {
    setLevelFilter(selectedOption);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (selectedOption) => {
    setCategoryFilter(selectedOption);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (selectedOption) => {
    setDateRange(selectedOption.value);
    setCurrentPage(1);
  };

  const handleCleanupLogs = async () => {
    if (window.confirm("Are you sure you want to clean up logs older than 30 days?")) {
      try {
        await cleanupLogs(30);
        toast.success("Old logs cleaned up successfully!");
        refetchLogs();
      } catch {
        toast.error("Failed to cleanup logs");
      }
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <FaTimesCircle className="text-red-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'info':
        return <FaInfo className="text-blue-500" />;
      case 'debug':
        return <FaCheckCircle className="text-green-500" />;
      default:
        return <FaInfo className="text-gray-500" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'auth':
        return <FaUser className="text-blue-500" />;
      case 'transaction':
        return <FaCreditCard className="text-green-500" />;
      case 'user':
        return <FaUserShield className="text-purple-500" />;
      case 'system':
        return <FaServer className="text-gray-500" />;
      case 'game':
        return <FaGamepad className="text-orange-500" />;
      case 'game_manipulation':
        return <FaShieldAlt className="text-red-500" />;
      case 'newsletter':
        return <FaEnvelope className="text-indigo-500" />;
      case 'api':
        return <FaServer className="text-teal-500" />;
      case 'admin':
        return <FaUserShield className="text-orange-500" />;
      case 'payment':
        return <FaShoppingCart className="text-emerald-500" />;
      default:
        return <FaInfo className="text-gray-500" />;
    }
  };

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'auth':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transaction':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'user':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'system':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'game':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'game_manipulation':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'newsletter':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'api':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'admin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'payment':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const columns = [
    {
      header: "Level",
      render: (log) => (
        <div className="flex items-center space-x-2 min-w-0">
          {getLevelIcon(log.level)}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getLevelBadgeColor(log.level)}`}>
            {log.level.toUpperCase()}
          </span>
        </div>
      ),
      className: "w-20"
    },
    {
      header: "Category",
      render: (log) => (
        <div className="flex items-center space-x-2 min-w-0">
          {getCategoryIcon(log.category)}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getCategoryBadgeColor(log.category)}`}>
            {log.category.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      ),
      className: "w-32"
    },
    {
      header: "Message",
      render: (log) => (
        <div className="max-w-xs lg:max-w-md xl:max-w-lg">
          <div className="text-sm font-medium text-gray-900 truncate" title={log.message}>
            {log.message}
          </div>
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {Object.keys(log.metadata).length} metadata fields
            </div>
          )}
        </div>
      ),
      className: "min-w-0 flex-1"
    },
    {
      header: "User",
      render: (log) => (
        <div className="text-sm min-w-0">
          {log.userEmail ? (
            <div>
              <div className="font-medium text-gray-900 truncate" title={log.userEmail}>
                {log.userEmail}
              </div>
              {log.userId && (
                <div className="text-xs text-gray-500 truncate">
                  {typeof log.userId === 'object' && log.userId?.username
                    ? `User: ${log.userId.username}`
                    : `ID: ${typeof log.userId === 'object' ? log.userId._id : log.userId}`
                  }
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">System</span>
          )}
        </div>
      ),
      className: "w-40"
    },
    {
      header: "Timestamp",
      render: (log) => (
        <div className="text-sm text-gray-600 whitespace-nowrap">
          <div>{new Date(log.timestamp).toLocaleDateString()}</div>
          <div className="text-xs">{new Date(log.timestamp).toLocaleTimeString()}</div>
        </div>
      ),
      className: "w-32"
    },
    {
      header: "IP & Agent",
      render: (log) => (
        <div className="text-xs text-gray-500 max-w-32 hidden lg:block">
          {log.ipAddress && (
            <div className="truncate" title={log.ipAddress}>
              IP: {log.ipAddress}
            </div>
          )}
          {log.userAgent && (
            <div className="truncate" title={log.userAgent}>
              Agent: {log.userAgent.substring(0, 25)}...
            </div>
          )}
        </div>
      ),
      className: "w-40 hidden lg:table-cell"
    },
    {
      header: "Actions",
      render: (log) => (
        <button
          className="bg-blue-500 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-600 transition-colors whitespace-nowrap"
          onClick={() => {
            // Show detailed log information
            const details = {
              ID: log._id,
              Level: log.level,
              Category: log.category,
              Message: log.message,
              User: log.userEmail || 'System',
              UserID: typeof log.userId === 'object' && log.userId?._id ? log.userId._id : (log.userId || 'N/A'),
              Username: typeof log.userId === 'object' && log.userId?.username ? log.userId.username : 'N/A',
              Timestamp: new Date(log.timestamp).toLocaleString(),
              IP: log.ipAddress || 'N/A',
              UserAgent: log.userAgent || 'N/A',
              Metadata: log.metadata ? JSON.stringify(log.metadata, null, 2) : 'None'
            };

            const detailsString = Object.entries(details)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');

            alert(detailsString);
          }}
        >
          <FaEye className="inline h-3 w-3 mr-1" />
          <span className="hidden xl:inline">View</span>
        </button>
      ),
      className: "w-20"
    },
  ];

  const totalPages = logsData?.totalPages || 1;

  return (
    <div className="my-3 md:my-5 p-2 md:px-4 sm:px-6 lg:px-2">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">System Logs</h1>
        <p className="text-gray-600 text-sm md:text-base">Monitor system activities, errors, and user actions</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-xs md:text-sm font-medium">Error Logs</p>
              <p className="text-lg md:text-2xl font-bold">{statsData?.errorCount || 0}</p>
            </div>
            <FaTimesCircle className="h-6 w-6 md:h-8 md:w-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-xs md:text-sm font-medium">Warning Logs</p>
              <p className="text-lg md:text-2xl font-bold">{statsData?.warningCount || 0}</p>
            </div>
            <FaExclamationTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs md:text-sm font-medium">Info Logs</p>
              <p className="text-lg md:text-2xl font-bold">{statsData?.infoCount || 0}</p>
            </div>
            <FaInfo className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs md:text-sm font-medium">Total Logs</p>
              <p className="text-lg md:text-2xl font-bold">{statsData?.totalLogs || 0}</p>
            </div>
            <FaServer className="h-6 w-6 md:h-8 md:w-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-4 md:mb-6 px-2 md:px-0">
        {/* Header with count */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div className="text-xs md:text-sm text-gray-600">
            {logsData?.total || 0} logs found
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {/* Search Input - Full width on mobile, spans 2 cols on lg+ */}
          <div className="relative sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="border border-gray-300 rounded-lg px-3 md:px-4 py-2 pl-8 md:pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm"
            />
            <FaSearch className="absolute left-2 md:left-3 top-2.5 md:top-3 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
          </div>

          {/* Level Filter */}
          <div className="sm:col-span-1">
            <Select
              options={[
                { value: "", label: "All Levels" },
                { value: "error", label: "Error" },
                { value: "warning", label: "Warning" },
                { value: "info", label: "Info" },
                { value: "debug", label: "Debug" },
              ]}
              value={levelFilter}
              onChange={handleLevelFilterChange}
              className="w-full text-sm"
              placeholder="Level"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '36px',
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  '&:hover': { borderColor: '#9ca3af' },
                  boxShadow: 'none',
                  '&:focus-within': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 1px #3b82f6'
                  }
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#9ca3af',
                  fontSize: '12px'
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#374151',
                  fontSize: '12px'
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }),
                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#eff6ff' : 'white',
                  color: isSelected ? 'white' : '#374151',
                  fontSize: '12px'
                })
              }}
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-1">
            <Select
              options={[
                { value: "", label: "All Categories" },
                { value: "auth", label: "Auth" },
                { value: "transaction", label: "Transaction" },
                { value: "user", label: "User" },
                { value: "system", label: "System" },
                { value: "game", label: "Game" },
                { value: "game_manipulation", label: "Game Manipulation" },
                { value: "newsletter", label: "Newsletter" },
                { value: "api", label: "API" },
                { value: "admin", label: "Admin" },
                { value: "payment", label: "Payment" },
              ]}
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              className="w-full text-sm"
              placeholder="Category"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '36px',
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  '&:hover': { borderColor: '#9ca3af' },
                  boxShadow: 'none',
                  '&:focus-within': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 1px #3b82f6'
                  }
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#9ca3af',
                  fontSize: '12px'
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#374151',
                  fontSize: '12px'
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }),
                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#eff6ff' : 'white',
                  color: isSelected ? 'white' : '#374151',
                  fontSize: '12px'
                })
              }}
            />
          </div>

          {/* Date Range Filter */}
          <div className="sm:col-span-1">
            <Select
              options={[
                { value: "1h", label: "Last Hour" },
                { value: "24h", label: "Last 24 Hours" },
                { value: "7d", label: "Last 7 Days" },
                { value: "30d", label: "Last 30 Days" },
                { value: "all", label: "All Time" },
              ]}
              value={{ value: dateRange, label: dateRange === "1h" ? "Last Hour" : dateRange === "24h" ? "Last 24 Hours" : dateRange === "7d" ? "Last 7 Days" : dateRange === "30d" ? "Last 30 Days" : "All Time" }}
              onChange={handleDateRangeChange}
              className="w-full text-sm"
              placeholder="Time Range"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '36px',
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  '&:hover': { borderColor: '#9ca3af' },
                  boxShadow: 'none',
                  '&:focus-within': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 1px #3b82f6'
                  }
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#9ca3af',
                  fontSize: '12px'
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#374151',
                  fontSize: '12px'
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }),
                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#eff6ff' : 'white',
                  color: isSelected ? 'white' : '#374151',
                  fontSize: '12px'
                })
              }}
            />
          </div>

          {/* Cleanup Button */}
          <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
            <button
              onClick={handleCleanupLogs}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 md:px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-xs md:text-sm w-full h-9 flex items-center justify-center"
            >
              <FaSync className="inline mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Cleanup</span>
              <span className="sm:hidden">Clean</span>
            </button>
          </div>
        </div>
      </div>

      {isLogsLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-white rounded-full p-6 shadow-lg mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Logs</h3>
          <p className="text-gray-600 text-center max-w-md">
            Please wait while we fetch the system logs...
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-2 md:mx-0">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <Table columns={columns} data={logsData?.logs || []} />
            </div>
          </div>
        </div>
      )}

      <Pagination
        currentPage={logsData?.currentPage || currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default SystemLogs;