import { useState, useEffect } from "react";
import axios from "axios";
import { FaFileAlt, FaSearch, FaFilter, FaDownload, FaEye } from "react-icons/fa";

const SystemLogs = () => {
  const isDarkMode = false; // Temporary fix for demo
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 10;

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: logsPerPage.toString(),
      });

      if (filterType !== "all") {
        params.append("level", filterType);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await axios.get(`/api/users/admin/logs?${params.toString()}`);
      const { logs: fetchedLogs, pagination } = response.data;

      // Transform the data to match the frontend format
      const transformedLogs = fetchedLogs.map(log => ({
        id: log._id,
        timestamp: new Date(log.timestamp).toLocaleString(),
        level: log.level.toUpperCase(),
        message: log.message,
        user: log.userEmail || log.userId?.email || "system",
        ip: log.ipAddress || "N/A",
        action: log.category.toUpperCase()
      }));

      setLogs(transformedLogs);
      setFilteredLogs(transformedLogs);
      setTotalPages(pagination.pages);
      setTotalLogs(pagination.total);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError("Failed to fetch system logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterType, searchTerm]);

  // Filter logs based on search term and filter type
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(log => log.level.toLowerCase() === filterType);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterType, logs]);

  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "error":
        return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300";
      case "warning":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300";
      case "info":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  return (
    <div className={`p-2 md:p-6 ${isDarkMode ? "bg-gray-900 text-white" : "ot-admin-soft ot-admin-ink"} min-h-screen`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-4">
            <FaFileAlt className="text-lg md:text-2xl text-green-600" />
            <h1 className="ot-admin-page-title text-xl md:text-3xl font-bold">System Logs</h1>
          </div>
          <p className={`text-xs md:text-sm ${isDarkMode ? "ot-admin-muted" : "ot-admin-muted"}`}>
            Monitor system activities, errors, and user actions
          </p>
        </div>

        {/* Filters and Search */}
        <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "ot-admin-paper"} `}>
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Search */}
            <div className="w-full">
              <div className="relative">
                <FaSearch className="absolute left-3 top-2.5 md:top-3 ot-admin-muted text-sm md:text-base" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 md:pl-10 pr-4 py-2 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-700 ot-admin-border text-white placeholder-gray-400"
                      : "ot-admin-paper ot-admin-border ot-admin-ink placeholder-gray-500"
                  }`}
                />
              </div>
            </div>

            {/* Filter and Export Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center space-x-2 flex-1">
                <FaFilter className="ot-admin-muted text-sm md:text-base" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`flex-1 px-3 py-2 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-700 ot-admin-border text-white"
                      : "ot-admin-paper ot-admin-border ot-admin-ink"
                  }`}
                >
                  <option value="all">All Levels</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                </select>
              </div>

              {/* Export Button */}
              <button
                className="ot-admin-control flex items-center justify-center space-x-2 px-3 md:px-4 py-2 ot-admin-action text-white rounded-lg transition-colors text-sm md:text-base"
              >
                <FaDownload className="text-xs md:text-sm" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`text-center py-8 md:py-12 ${isDarkMode ? "ot-admin-muted" : "ot-admin-muted"}`}>
            <div className="animate-spin rounded-full h-8 md:h-12 w-8 md:w-12 border-b-2 border-green-600 mx-auto mb-3 md:mb-4"></div>
            <p className="text-sm md:text-base">Loading system logs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`text-center py-8 md:py-12 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
            <FaFileAlt className="mx-auto h-8 md:h-12 w-8 md:w-12 mb-3 md:mb-4 opacity-50" />
            <p className="text-base md:text-lg font-medium mb-2">Error loading logs</p>
            <p className="text-sm md:text-base">{error}</p>
          </div>
        )}

        {/* Logs Table */}
        {!loading && !error && (
          <div className={`rounded-lg overflow-hidden ${isDarkMode ? "bg-gray-800" : "ot-admin-paper"}`}>
            <div className="overflow-x-auto">
              <table className="ot-admin-data-table w-full">
                <thead className={`${isDarkMode ? "bg-gray-700" : "ot-admin-soft"}`}>
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider">Timestamp</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider">Level</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider">Message</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">User</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">IP Address</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Action</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {currentLogs.map((log) => (
                    <tr key={log.id} className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm">
                        <div className="block sm:hidden">
                          {new Date(log.timestamp).toLocaleDateString()}
                          <br />
                          <span className="ot-admin-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="hidden sm:block">
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span className={`inline-flex px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-semibold rounded-full ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm max-w-32 md:max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm hidden sm:table-cell">
                        {log.user}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm hidden md:table-cell">
                        {log.ip}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm hidden lg:table-cell">
                        {log.action}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm">
                        <button className="ot-admin-control text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1">
                          <FaEye className="text-xs md:text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-3 md:px-6 py-2 md:py-3 ${isDarkMode ? "bg-gray-700" : "ot-admin-soft"} flex flex-col sm:flex-row items-center justify-between gap-2`}>
              <div className={`text-xs md:text-sm ${isDarkMode ? "ot-admin-muted" : "ot-admin-ink"} text-center sm:text-left`}>
                {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, totalLogs)} of {totalLogs} logs
              </div>
              <div className="flex space-x-1 md:space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="ot-admin-control px-2 md:px-3 py-1 text-xs md:text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Prev
                </button>
                <span className={`px-2 md:px-3 py-1 text-xs md:text-sm ${isDarkMode ? "text-gray-300" : "ot-admin-ink"}`}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ot-admin-control px-2 md:px-3 py-1 text-xs md:text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredLogs.length === 0 && (
            <div className={`text-center py-8 md:py-12 ${isDarkMode ? "ot-admin-muted" : "ot-admin-muted"}`}>
              <FaFileAlt className="mx-auto h-8 md:h-12 w-8 md:w-12 mb-3 md:mb-4 opacity-50" />
              <h3 className="text-base md:text-lg font-medium mb-2">No logs found</h3>
              <p className="text-sm md:text-base">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;