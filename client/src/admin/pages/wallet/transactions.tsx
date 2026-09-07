import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllTransactions } from '../../api';
import { toast } from 'react-toastify';
import { FaEye, FaFilter, FaSearch, FaSort, FaSortUp, FaSortDown, FaTimes } from 'react-icons/fa';
import Chip from '../../components/status';

const Transactions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data, error, isLoading, refetch } = useQuery(
    ['transactions', currentPage, limit, sortField, sortOrder, typeFilter, statusFilter, searchQuery],
    () => getAllTransactions(currentPage, limit, typeFilter, searchQuery)
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = (transaction) => {
    console.log('Opening modal for transaction:', transaction);
    alert('Opening modal for transaction: ' + transaction.reference);
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTransaction(null);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 h-3 w-3 ot-admin-muted" />;
    return sortOrder === 'asc'
      ? <FaSortUp className="ml-1 h-3 w-3 text-blue-600" />
      : <FaSortDown className="ml-1 h-3 w-3 text-blue-600" />;
  };

  if (error) {
    toast.error(error.message || "Error fetching transactions");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="ot-admin-page-title text-2xl font-bold ot-admin-ink ">Transactions</h1>
          <div className="w-24 h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="ot-admin-paper rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index}>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="ot-admin-paper rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ot-admin-data-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="ot-admin-soft ">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                  </th>
                </tr>
              </thead>
              <tbody className="ot-admin-paper divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        <div className="ml-2 h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="ml-3 space-y-1">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 mt-1"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="ot-admin-page-title text-2xl font-bold ot-admin-ink ">Transactions</h1>
        <button
          onClick={() => refetch()}
          className="ot-admin-control inline-flex items-center px-4 py-2 border ot-admin-border rounded-md text-sm font-medium ot-admin-ink ot-admin-paper hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaFilter className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="ot-admin-paper rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium ot-admin-ink mb-2">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 h-4 w-4 ot-admin-muted" />
              <input
                type="text"
                placeholder="Search by reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full px-3 py-2 border ot-admin-border rounded-md focus:ring-blue-500 focus:border-blue-500 "
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium ot-admin-ink mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border ot-admin-border rounded-md focus:ring-blue-500 focus:border-blue-500 "
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium ot-admin-ink mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border ot-admin-border rounded-md focus:ring-blue-500 focus:border-blue-500 "
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="ot-admin-control w-full px-4 py-2 ot-admin-soft ot-admin-ink rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {data && data.transactions && data.transactions.length > 0 ? (
        <div className="ot-admin-paper rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ot-admin-data-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="ot-admin-soft ">
                <tr>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center">
                      Reference
                      {getSortIcon('reference')}
                    </div>
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                    User
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      Amount
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                    Type
                  </th>
                  <th
                    className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Date
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium ot-admin-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="ot-admin-paper divide-y divide-gray-200 dark:divide-gray-700">
                {data.transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium ot-admin-ink ">
                            {transaction.reference && transaction.reference.length > 15
                              ? `${transaction.reference.slice(0, 15)}...`
                              : transaction.reference}
                          </div>
                          <div className="text-sm ot-admin-muted ">
                            ID: {transaction._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="ot-admin-neutral-card h-8 w-8 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {(transaction.user?.username || "N/A").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium ot-admin-ink ">
                            {transaction.user?.username || "N/A"}
                          </div>
                          <div className="text-sm ot-admin-muted ">
                            {transaction.user?.email || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold ot-admin-ink ">
                        ₦{transaction.amount.toLocaleString('en-NG')}
                      </div>
                      {transaction.type === 'withdrawal' && transaction.details && (
                        <div className="text-xs ot-admin-muted space-y-1">
                          {transaction.details.originalAmount && (
                            <div>Requested: ₦{transaction.details.originalAmount.toLocaleString('en-NG')}</div>
                          )}
                          {transaction.details.feeAmount && transaction.details.feeAmount > 0 && (
                            <div>Fee: ₦{transaction.details.feeAmount.toLocaleString('en-NG')}</div>
                          )}
                          {transaction.details.feeDeductionMethod && (
                            <div className="text-xs">
                              Fee from: {transaction.details.feeDeductionMethod === 'fromWallet' ? 'Wallet' : 'Withdrawal'}
                            </div>
                          )}
                        </div>
                      )}
                      {transaction.type === 'withdrawal' && transaction.bankName && (
                        <div className="text-xs ot-admin-muted ">
                          {transaction.bankName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'deposit'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm ot-admin-muted ">
                      <div>
                        <div>{new Date(transaction.timestamp).toLocaleDateString()}</div>
                        <div className="text-xs">{new Date(transaction.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <Chip status={transaction.status} />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(transaction)}
                        className="ot-admin-control inline-flex items-center justify-center px-2 sm:px-3 py-1.5 border ot-admin-border text-xs font-medium rounded-md ot-admin-ink ot-admin-paper hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        title="View transaction details"
                      >
                        <FaEye className="mr-1 h-3 w-3" />
                        <span className="hidden sm:inline">View</span>
                        <span className="sm:hidden">👁</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="ot-admin-paper px-4 py-3 flex items-center justify-between border-t ot-admin-border sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="ot-admin-control relative inline-flex items-center px-4 py-2 border ot-admin-border text-sm font-medium rounded-md ot-admin-ink ot-admin-paper hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(data.totalPages, currentPage + 1))}
                disabled={currentPage === data.totalPages}
                className="ot-admin-control ml-3 relative inline-flex items-center px-4 py-2 border ot-admin-border text-sm font-medium rounded-md ot-admin-ink ot-admin-paper hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm ot-admin-ink ">
                  Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * limit, data.totalTransactions)}
                  </span>{' '}
                  of <span className="font-medium">{data.totalTransactions}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="ot-admin-control relative inline-flex items-center px-2 py-2 rounded-l-md border ot-admin-border ot-admin-paper text-sm font-medium ot-admin-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    ‹
                  </button>
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(data.totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`ot-admin-control relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'ot-admin-paper ot-admin-border ot-admin-muted hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(data.totalPages, currentPage + 1))}
                    disabled={currentPage === data.totalPages}
                    className="ot-admin-control relative inline-flex items-center px-2 py-2 rounded-r-md border ot-admin-border ot-admin-paper text-sm font-medium ot-admin-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    ›
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 ot-admin-soft rounded-full flex items-center justify-center mb-4">
            <FaSearch className="h-12 w-12 ot-admin-muted" />
          </div>
          <h3 className="text-lg font-medium ot-admin-ink mb-2">No transactions found</h3>
          <p className="ot-admin-muted ">
            {searchQuery || typeFilter || statusFilter
              ? "Try adjusting your filters to see more results."
              : "There are no transactions to display at the moment."}
          </p>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 9999 }}>
          <div className="ot-admin-paper rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b ot-admin-border ">
              <h3 className="text-lg font-semibold ot-admin-ink ">
                Transaction Details
              </h3>
              <button
                onClick={closeDetailModal}
                className="ot-admin-control ot-admin-muted hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium ot-admin-ink ">
                    Reference
                  </label>
                  <p className="mt-1 text-sm ot-admin-ink ">
                    {selectedTransaction.reference}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium ot-admin-ink ">
                    Type
                  </label>
                  <p className="mt-1 text-sm ot-admin-ink capitalize">
                    {selectedTransaction.type}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium ot-admin-ink ">
                    Status
                  </label>
                  <div className="mt-1">
                    <Chip status={selectedTransaction.status} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium ot-admin-ink ">
                    Date
                  </label>
                  <p className="mt-1 text-sm ot-admin-ink ">
                    {new Date(selectedTransaction.timestamp).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium ot-admin-ink ">
                    Amount
                  </label>
                  <p className="mt-1 text-sm font-semibold ot-admin-ink ">
                    ₦{selectedTransaction.amount.toLocaleString('en-NG')}
                  </p>
                </div>

                {selectedTransaction.user && (
                  <div>
                    <label className="block text-sm font-medium ot-admin-ink ">
                      User
                    </label>
                    <p className="mt-1 text-sm ot-admin-ink ">
                      {selectedTransaction.user.username}
                    </p>
                    <p className="text-xs ot-admin-muted ">
                      {selectedTransaction.user.email}
                    </p>
                  </div>
                )}
              </div>

              {selectedTransaction.type === 'withdrawal' && selectedTransaction.details && (
                <div className="border-t ot-admin-border pt-4">
                  <h4 className="text-md font-semibold ot-admin-ink mb-3">
                    Withdrawal Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTransaction.details.originalAmount && (
                      <div>
                        <label className="block text-sm font-medium ot-admin-ink ">
                          Requested Amount
                        </label>
                        <p className="mt-1 text-sm ot-admin-ink ">
                          ₦{selectedTransaction.details.originalAmount.toLocaleString('en-NG')}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.details.feeAmount && selectedTransaction.details.feeAmount > 0 && (
                      <div>
                        <label className="block text-sm font-medium ot-admin-ink ">
                          Fee Amount
                        </label>
                        <p className="mt-1 text-sm ot-admin-ink ">
                          ₦{selectedTransaction.details.feeAmount.toLocaleString('en-NG')}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.details.feeDeductionMethod && (
                      <div>
                        <label className="block text-sm font-medium ot-admin-ink ">
                          Fee Deduction Method
                        </label>
                        <p className="mt-1 text-sm ot-admin-ink capitalize">
                          {selectedTransaction.details.feeDeductionMethod === 'fromWallet' ? 'From Wallet' : 'From Withdrawal'}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.details.totalDebited && (
                      <div>
                        <label className="block text-sm font-medium ot-admin-ink ">
                          Total Debited
                        </label>
                        <p className="mt-1 text-sm ot-admin-ink ">
                          ₦{selectedTransaction.details.totalDebited.toLocaleString('en-NG')}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.bankName && (
                      <div>
                        <label className="block text-sm font-medium ot-admin-ink ">
                          Bank Name
                        </label>
                        <p className="mt-1 text-sm ot-admin-ink ">
                          {selectedTransaction.bankName}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.accountNumber && (
                      <div>
                        <label className="block text-sm font-medium ot-admin-ink ">
                          Account Number
                        </label>
                        <p className="mt-1 text-sm ot-admin-ink ">
                          {selectedTransaction.accountNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t ot-admin-border ">
              <button
                onClick={closeDetailModal}
                className="ot-admin-control px-4 py-2 ot-admin-soft ot-admin-ink rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;