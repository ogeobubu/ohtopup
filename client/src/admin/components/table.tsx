import { ReactNode } from "react";

type Column = { header: string; render: (item: any) => ReactNode };

export default function Table({ columns, data }: { columns: Column[]; data: any[] }) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-bg text-[10px] text-muted">
            {columns?.map((column, index) => (
              <th key={index} scope="col" className="px-4 py-3 font-medium tracking-[0.3px]">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.length ? (
            data.map((item, index) => (
              <tr key={item._id || index} className="border-b border-line last:border-b-0 hover:bg-bg">
                {columns?.map((column, columnIndex) => (
                  <td key={columnIndex} className="px-4 py-3.5">
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns?.length}>
                <div className="p-12 text-center text-xs text-muted">No records found.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
