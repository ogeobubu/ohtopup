import React from "react";
import emptyImage from "../../assets/undraw_empty_re_opql.svg";

const Table = ({ columns, data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-[#F7F9FB] py-3 font-bold text-gray-700">
            {columns?.map((col, index) => (
              <th key={index} className="px-4 py-2 text-left">
                {col?.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <tr
                key={index}
                className={`bg-white ${
                  index === data.length - 1 ? "border-b-0" : "border-b border-gray-300"
                }`}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 text-left text-gray-700">
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-20">
                <img 
                  src={emptyImage} 
                  alt="No data" 
                  className="mx-auto h-[150px] w-[300px] mb-4"
                />
                <p className="text-gray-500">No data available</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;