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
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isLoading) {
      try {
        await onConfirm();
      } catch (error) {
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg p-6 w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Confirm Data Purchase
        </h3>
        <div className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <span>Network:</span>
            <span className="font-medium">{transactionDetails?.providerName}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <span>Phone Number:</span>
            <span className="font-medium">{formatPhoneNumber(transactionDetails?.phoneNumber)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <span>Data Plan:</span>
            <span className="font-medium">{transactionDetails?.planName}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <span>Amount:</span>
            <span className="font-medium">{formatNairaAmount(transactionDetails?.amount)}</span>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md ${
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
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed relative min-w-[120px]`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="mr-2">Processing</span>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              </span>
            ) : (
              "Confirm Purchase"
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