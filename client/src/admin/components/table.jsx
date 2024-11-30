import React from "react";
import emptyImage from "../../assets/undraw_receipt_re_fre3.svg";

const Table = ({ columns, data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="bg-[#F7F9FB] text-gray-700">
            {columns?.map((col, index) => (
              <th
                key={index}
                className="px-2 py-2 text-left font-semibold text-sm sm:text-base md:text-lg"
              >
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
                  index === data.length - 1
                    ? "border-b-0"
                    : "border-b border-gray-300"
                }`}
              >
                {columns?.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-2 py-3 text-left text-gray-700 text-sm sm:text-base md:text-lg"
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns?.length} className="text-center py-10">
                <img
                  src={emptyImage}
                  alt="No data"
                  className="mx-auto h-20 w-auto mb-4 sm:h-32 md:h-40 lg:h-48 xl:h-32"
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
