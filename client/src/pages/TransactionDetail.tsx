import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { getTransactionDetails } from "../api";
import { FaArrowLeft, FaDownload, FaCheck, FaTimes, FaClock, FaUser, FaCreditCard, FaMobileAlt, FaCalendarAlt, FaIdCard } from "react-icons/fa";
import { formatNairaAmount } from "../utils";

const TransactionDetail = ({ isDarkMode }) => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: transactionData, isLoading, error } = useQuery({
    queryKey: ['transaction-detail', requestId],
    queryFn: () => getTransactionDetails(requestId),
    enabled: !!requestId,
  });

  const transaction = transactionData?.transaction;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <FaCheck className="text-green-600" />;
      case 'pending':
        return <FaClock className="text-yellow-600" />;
      case 'failed':
        return <FaTimes className="text-red-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // PDF generation will be implemented in the next step
      alert('PDF generation will be implemented soon!');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-400">Loading transaction details...</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaTimes className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Transaction Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || "The requested transaction could not be found."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <FaArrowLeft className="text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Transaction Details</h1>
                <p className="text-blue-100">Request ID: {transaction.requestId}</p>
              </div>
            </div>
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <FaDownload className="text-sm" />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Transaction Status</h2>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(transaction.status)}`}>
              {getStatusIcon(transaction.status)}
              {transaction.status?.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaIdCard className="text-blue-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</p>
                  <p className="font-semibold">{transaction.requestId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaCreditCard className="text-green-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="font-semibold text-lg">{formatNairaAmount(transaction.amount)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaCalendarAlt className="text-purple-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                  <p className="font-semibold">
                    {new Date(transaction.transactionDate).toLocaleString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaMobileAlt className="text-orange-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Service Type</p>
                  <p className="font-semibold capitalize">{transaction.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaUser className="text-indigo-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Product Name</p>
                  <p className="font-semibold">{transaction.product_name}</p>
                </div>
              </div>

              {transaction.phone && (
                <div className="flex items-center gap-3">
                  <FaMobileAlt className="text-teal-500 text-lg" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone Number</p>
                    <p className="font-semibold">{transaction.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-lg font-bold mb-4">Additional Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Information */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">User Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium">
                    {transaction.user?.firstName} {transaction.user?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium">{transaction.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                  <span className="font-medium">{transaction.user?.phoneNumber}</span>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Transaction Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Service ID:</span>
                  <span className="font-medium">{transaction.serviceID || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                  <span className="font-medium">{formatNairaAmount(transaction.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Commission:</span>
                  <span className="font-medium">{formatNairaAmount(transaction.amount - transaction.revenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service-Specific Details */}
          {transaction.transactionType === 'utility' && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Service Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {transaction.provider && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                    <span className="font-medium">{transaction.provider}</span>
                  </div>
                )}
                {transaction.network && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Network:</span>
                    <span className="font-medium">{transaction.network.toUpperCase()}</span>
                  </div>
                )}
                {transaction.dataPlan && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Data Plan:</span>
                    <span className="font-medium">{transaction.dataPlan}</span>
                  </div>
                )}
                {transaction.dataAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Data Amount:</span>
                    <span className="font-medium">{transaction.dataAmount}</span>
                  </div>
                )}
                {transaction.validity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Validity:</span>
                    <span className="font-medium">{transaction.validity}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wallet Transaction Details */}
          {transaction.transactionType === 'wallet' && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Payment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {transaction.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                    <span className="font-medium capitalize">{transaction.paymentMethod.replace('_', ' ')}</span>
                  </div>
                )}
                {transaction.bankName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                    <span className="font-medium">{transaction.bankName}</span>
                  </div>
                )}
                {transaction.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Account:</span>
                    <span className="font-medium">****{transaction.accountNumber.slice(-4)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

TransactionDetail.propTypes = {
  isDarkMode: PropTypes.bool
};

export default TransactionDetail;