import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { getTransactionDetails } from "../../api";
import { FaArrowLeft, FaDownload, FaCheck, FaTimes, FaClock, FaUser, FaCreditCard, FaMobileAlt, FaCalendarAlt, FaIdCard, FaCog } from "react-icons/fa";
import { formatNairaAmount } from "../../utils";

const AdminTransactionDetail = ({ isDarkMode }) => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: transactionData, isLoading, error } = useQuery({
    queryKey: ['admin-transaction-detail', requestId],
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
        return <FaClock className="ot-admin-muted" />;
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // PDF generation will be implemented in the next step
      alert('PDF generation will be implemented soon!');
    } catch (error) {
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 ot-admin-muted ">Loading transaction details...</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaTimes className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold ot-admin-ink mb-2">
            Transaction Not Found
          </h2>
          <p className="ot-admin-muted mb-4">
            {error?.message || "The requested transaction could not be found."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="ot-admin-control ot-admin-action text-white font-semibold py-2 px-4 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'ot-admin-soft ot-admin-ink'}`}>
      {/* Header */}
      <div className="ot-admin-neutral-card py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="ot-admin-control p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <FaArrowLeft className="ot-admin-muted" />
              </button>
              <div>
                <h1 className="ot-admin-page-title text-3xl font-bold">Transaction Details</h1>
                <p className="ot-admin-muted">Request ID: {transaction.requestId}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="ot-admin-control flex items-center gap-2 ot-admin-paper text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <FaDownload className="text-sm" />
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                className="ot-admin-control flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <FaCog className="text-sm" />
                Actions
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'ot-admin-paper'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Transaction Status</h2>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(transaction.status)}`}>
              {getStatusIcon(transaction.status)}
              {transaction.status?.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaIdCard className="text-blue-500 text-lg" />
                <div>
                  <p className="text-sm ot-admin-muted ">Transaction ID</p>
                  <p className="font-semibold">{transaction.requestId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaCreditCard className="text-green-500 text-lg" />
                <div>
                  <p className="text-sm ot-admin-muted ">Amount</p>
                  <p className="font-semibold text-lg">{formatNairaAmount(transaction.amount)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaCalendarAlt className="text-purple-500 text-lg" />
                <div>
                  <p className="text-sm ot-admin-muted ">Date & Time</p>
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
                  <p className="text-sm ot-admin-muted ">Service Type</p>
                  <p className="font-semibold capitalize">{transaction.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaUser className="text-indigo-500 text-lg" />
                <div>
                  <p className="text-sm ot-admin-muted ">Product Name</p>
                  <p className="font-semibold">{transaction.product_name}</p>
                </div>
              </div>

              {transaction.phone && (
                <div className="flex items-center gap-3">
                  <FaMobileAlt className="text-teal-500 text-lg" />
                  <div>
                    <p className="text-sm ot-admin-muted ">Phone Number</p>
                    <p className="font-semibold">{transaction.phone}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaUser className="text-pink-500 text-lg" />
                <div>
                  <p className="text-sm ot-admin-muted ">Transaction Type</p>
                  <p className="font-semibold capitalize">{transaction.transactionType}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaCreditCard className="text-cyan-500 text-lg" />
                <div>
                  <p className="text-sm ot-admin-muted ">Customer charge</p>
                  <p className="font-semibold">{formatNairaAmount(transaction.revenue)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaCreditCard className="text-emerald-500 text-lg" />
                <div>
                  <p className="text-sm ot-admin-muted ">Customer discount</p>
                  <p className="font-semibold">{formatNairaAmount(transaction.discount || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {transaction.pricing && <section className="ot-panel p-4 sm:p-6 mb-6">
          <h3 className="mb-4">OhTopUp margin (before fees)</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><dt>Estimated provider cost</dt><dd>{transaction.pricing.estimatedProviderCost == null ? 'Not configured' : formatNairaAmount(transaction.pricing.estimatedProviderCost)}</dd></div>
            <div><dt>Estimated margin</dt><dd>{transaction.pricing.estimatedPlatformMargin == null ? 'Not configured' : formatNairaAmount(transaction.pricing.estimatedPlatformMargin)}</dd></div>
            <div><dt>Reported provider cost</dt><dd>{transaction.pricing.actualProviderCost == null ? 'Awaiting provider cost' : formatNairaAmount(transaction.pricing.actualProviderCost)}</dd></div>
            <div><dt>Confirmed margin</dt><dd>{transaction.status !== 'delivered' ? 'Not earned' : transaction.pricing.actualPlatformMargin == null ? 'Awaiting provider cost' : formatNairaAmount(transaction.pricing.actualPlatformMargin)}</dd></div>
          </dl>
          {transaction.pricing.costVariance > 0 && <p className="ot-field-error mt-4">The provider charged more than the configured estimate. Review this pricing rule.</p>}
        </section>}
        {/* User Information & Transaction Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Information */}
          <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'ot-admin-paper'}`}>
            <h3 className="text-lg font-bold mb-4">User Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="ot-admin-muted ">User ID:</span>
                <span className="font-medium">{transaction.user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="ot-admin-muted ">Name:</span>
                <span className="font-medium">
                  {transaction.user?.firstName} {transaction.user?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="ot-admin-muted ">Email:</span>
                <span className="font-medium">{transaction.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="ot-admin-muted ">Phone:</span>
                <span className="font-medium">{transaction.user?.phoneNumber}</span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'ot-admin-paper'}`}>
            <h3 className="text-lg font-bold mb-4">Transaction Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="ot-admin-muted ">Service ID:</span>
                <span className="font-medium">{transaction.serviceID || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="ot-admin-muted ">Discount:</span>
                <span className="font-medium">{formatNairaAmount(transaction.discount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="ot-admin-muted ">Customer discount rate:</span>
                <span className="font-medium">{transaction.commissionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="ot-admin-muted ">Payment Method:</span>
                <span className="font-medium capitalize">{transaction.paymentMethod || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service-Specific Details */}
        {transaction.transactionType === 'utility' && (
          <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'ot-admin-paper'}`}>
            <h3 className="text-lg font-bold mb-4">Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transaction.provider && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Provider:</span>
                  <span className="font-medium">{transaction.provider}</span>
                </div>
              )}
              {transaction.network && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Network:</span>
                  <span className="font-medium">{transaction.network.toUpperCase()}</span>
                </div>
              )}
              {transaction.dataPlan && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Data Plan:</span>
                  <span className="font-medium">{transaction.dataPlan}</span>
                </div>
              )}
              {transaction.dataAmount && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Data Amount:</span>
                  <span className="font-medium">{transaction.dataAmount}</span>
                </div>
              )}
              {transaction.validity && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Validity:</span>
                  <span className="font-medium">{transaction.validity}</span>
                </div>
              )}
              {transaction.providerStatus && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Provider Status:</span>
                  <span className="font-medium">{transaction.providerStatus}</span>
                </div>
              )}
              {transaction.token && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Electricity Token:</span>
                  <span className="font-medium font-mono bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded text-sm break-all max-w-xs">
                    {transaction.token}
                  </span>
                </div>
              )}
              {transaction.units && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Electricity Units:</span>
                  <span className="font-medium text-blue-600">{transaction.units}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wallet Transaction Details */}
        {transaction.transactionType === 'wallet' && (
          <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'ot-admin-paper'}`}>
            <h3 className="text-lg font-bold mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transaction.paymentMethod && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Payment Method:</span>
                  <span className="font-medium capitalize">{transaction.paymentMethod.replace('_', ' ')}</span>
                </div>
              )}
              {transaction.bankName && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Bank:</span>
                  <span className="font-medium">{transaction.bankName}</span>
                </div>
              )}
              {transaction.accountNumber && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Account:</span>
                  <span className="font-medium">****{transaction.accountNumber.slice(-4)}</span>
                </div>
              )}
              {transaction.bankCode && (
                <div className="flex justify-between">
                  <span className="ot-admin-muted ">Bank Code:</span>
                  <span className="font-medium">{transaction.bankCode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VTPass Error Details (Admin Only) */}
        {(transaction.vtpassResponseCode || transaction.vtpassResponseDescription || transaction.vtpassTransactionId) && (
          <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'ot-admin-paper'}`}>
            <h3 className="text-lg font-bold mb-4 text-red-600 dark:text-red-400">VTPass Error Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transaction.vtpassResponseCode && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm ot-admin-muted ">Response Code</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">{transaction.vtpassResponseCode}</p>
                </div>
              )}
              {transaction.vtpassResponseDescription && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm ot-admin-muted ">Response Description</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">{transaction.vtpassResponseDescription}</p>
                </div>
              )}
              {transaction.vtpassTransactionId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm ot-admin-muted ">VTPass Transaction ID</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 font-mono">{transaction.vtpassTransactionId}</p>
                </div>
              )}
              {transaction.vtpassTransactionStatus && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm ot-admin-muted ">Transaction Status</p>
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400">{transaction.vtpassTransactionStatus}</p>
                </div>
              )}
              {transaction.vtpassRequestId && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-sm ot-admin-muted ">VTPass Request ID</p>
                  <p className="font-semibold text-purple-600 dark:text-purple-400 font-mono">{transaction.vtpassRequestId}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Provider Response (Admin Only) */}
        {transaction.providerResponse && (
          <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'ot-admin-paper'}`}>
            <h3 className="text-lg font-bold mb-4">Full Provider Response</h3>
            <div className="ot-admin-soft p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(transaction.providerResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AdminTransactionDetail.propTypes = {
  isDarkMode: PropTypes.bool
};

export default AdminTransactionDetail;