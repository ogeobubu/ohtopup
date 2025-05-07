import PropTypes from 'prop-types';
import { formatNairaAmount } from '../../../../utils';

const TransactionSummary = ({ amount, walletBalance, isDarkMode }) => {
  return (
    <div className={`rounded-lg p-4 w-full ${
      isDarkMode ? 'bg-gray-700' : 'bg-[#F7F9FB]'
    }`}>
      <div className="flex justify-between items-center">
        <h2 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</h2>
        <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {formatNairaAmount(amount) || "₦0"}
        </p>
      </div>
      {walletBalance && (
        <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Wallet Balance: {formatNairaAmount(walletBalance)}
        </div>
      )}
    </div>
  );
};

TransactionSummary.propTypes = {
  amount: PropTypes.number,
  walletBalance: PropTypes.number,
  isDarkMode: PropTypes.bool
};

export default TransactionSummary;