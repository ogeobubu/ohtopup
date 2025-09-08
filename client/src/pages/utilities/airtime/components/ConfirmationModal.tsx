import PropTypes from 'prop-types';
import { formatNairaAmount, formatPhoneNumber } from '../../../../utils';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transactionDetails, 
  isDarkMode,
  isLoading
}) => {
  const handleConfirm = async () => {
    if (!isLoading) {
      try {
        await onConfirm();
      } catch (error) {
        // Error is handled by the parent component
        console.error('Purchase confirmation failed:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Confirm Purchase
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Please review your airtime purchase details
          </p>
        </div>

        {/* Transaction Details */}
        <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Network Provider</span>
              <span className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {transactionDetails?.providerName}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Phone Number</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatPhoneNumber(transactionDetails?.phoneNumber)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Amount</span>
              <span className={`font-bold text-xl text-green-600 dark:text-green-400`}>
                {formatNairaAmount(transactionDetails?.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-amber-900/30 border-amber-600' : 'bg-amber-50 border-amber-200'} border`}>
          <div className="flex items-start">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                Important Notice
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                Please ensure the phone number and amount are correct. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm Purchase
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  transactionDetails: PropTypes.object,
  isDarkMode: PropTypes.bool,
  isLoading: PropTypes.bool
};

ConfirmationModal.defaultProps = {
  isLoading: false
};

export default ConfirmationModal;