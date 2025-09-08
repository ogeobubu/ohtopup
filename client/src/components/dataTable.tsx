import React from "react";
import { useSelector } from "react-redux";
import PropTypes from 'prop-types';

const DataTable = ({ columns, data, emptyMessage = "No data available" }) => {
  const isDarkMode = useSelector((state) => state.theme && state.theme.isDarkMode);

  return (
    <div className={`rounded-lg overflow-hidden shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              {columns?.map((col, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {col?.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                  {columns?.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 text-sm text-gray-900 dark:text-white ${
                        colIndex === 0 ? 'whitespace-nowrap' : ''
                      }`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns?.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  emptyMessage: PropTypes.string,
};

export default DataTable;