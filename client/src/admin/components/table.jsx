import React from "react";

const Table = ({ columns, data }) => {
  return (
    <table className="w-full table-auto">
      <thead>
        <tr className="bg-[#F7F9FB] py-3 font-bold text-gray-700">
          {columns.map((col, index) => (
            <th key={index} className="px-4 py-2 text-left">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
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
        ))}
      </tbody>
    </table>
  );
};

export default Table;