import { useSelector } from "react-redux";
import Chip from "../../components/ui/chip";
import { MdRefresh } from "react-icons/md";
import PropTypes from 'prop-types';

const TransactionTable = ({ data, onRequery }) => {
  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode || false);

  return (
    <div className={`rounded-lg overflow-hidden shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
            {data && data.length > 0 ? (
              data.map((row, index) => (
                <tr key={index} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {row.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Chip status={row.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₦{row.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {row.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {row.status !== "delivered" && onRequery && (
                      <button
                        onClick={() => onRequery(row.requestId)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        <MdRefresh />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

TransactionTable.propTypes = {
  data: PropTypes.array,
  onRequery: PropTypes.func,
};

export default TransactionTable;