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
    <div className={`p-6 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} min-h-screen`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FaFileAlt className="text-2xl text-green-600" />
            <h1 className="text-3xl font-bold">System Logs</h1>
          </div>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Monitor system activities, errors, and user actions
          </p>
        </div>

        {/* Filters and Search */}
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
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
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`text-center py-12 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Loading system logs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`text-center py-12 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
            <FaFileAlt className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Error loading logs</p>
            <p>{error}</p>
          </div>
        )}

        {/* Logs Table */}
        {!loading && !error && (
          <div className={`rounded-lg overflow-hidden shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {currentLogs.map((log) => (
                    <tr key={log.id} className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-6 py-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"} flex items-center justify-between`}>
              <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, totalLogs)} of {totalLogs} logs
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredLogs.length === 0 && (
            <div className={`text-center py-12 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              <FaFileAlt className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No logs found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;