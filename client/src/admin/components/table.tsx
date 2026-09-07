import { ReactNode } from "react";

type Column = { header: string; render: (item: any) => ReactNode };
export default function Table({ columns, data }: { columns: Column[]; data: any[] }) {
  return <div className="ot-admin-table-wrap"><table className="ot-admin-table">
    <thead><tr>{columns?.map((column, index) => <th key={index} scope="col">{column.header}</th>)}</tr></thead>
    <tbody>{data?.length ? data.map((item, index) => <tr key={item._id || index}>{columns?.map((column, columnIndex) => <td key={columnIndex}>{column.render(item)}</td>)}</tr>) : <tr><td colSpan={columns?.length}><div className="ot-empty">No records found.</div></td></tr>}</tbody>
  </table></div>;
}
