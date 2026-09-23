import { Link } from "react-router-dom";
import { FiRefreshCw, FiArrowUpRight } from "react-icons/fi";
import { formatNairaAmount } from "../../utils";
import Status from "./status";

type Transaction = {
  _id?: string;
  requestId: string;
  product_name: string;
  status: string;
  amount: number;
  phone: string;
  createdAt: string;
};

const iconBtn =
  "flex h-11 w-11 items-center justify-center rounded-md text-muted transition hover:bg-tint hover:text-ink";

export default function TransactionTable({
  data = [],
  onRequery,
}: {
  data: Transaction[];
  onRequery?: (reference: string) => void;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-bg text-[10px] text-muted">
            {["Product", "Status", "Amount", "Recipient", "Date", "Actions"].map((label) => (
              <th scope="col" key={label} className="px-4 py-3 font-medium tracking-[0.3px]">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map((row) => (
              <tr key={row._id || row.requestId} className="border-b border-line last:border-b-0 hover:bg-bg">
                <td className="px-4 py-3.5">
                  <strong className="block font-medium capitalize">{row.product_name}</strong>
                  <small className="mt-1 block overflow-wrap-anywhere text-[10px] text-muted">
                    {row.requestId}
                  </small>
                </td>
                <td className="px-4 py-3.5">
                  <Status status={row.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">{formatNairaAmount(row.amount)}</td>
                <td className="px-4 py-3.5">{row.phone}</td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  {new Date(row.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <Link
                      className={iconBtn}
                      to={`/admin/transactions/${encodeURIComponent(row.requestId)}`}
                      aria-label={`View transaction ${row.requestId}`}
                      title="View transaction"
                    >
                      <FiArrowUpRight />
                    </Link>
                    {row.status !== "delivered" && onRequery && (
                      <button
                        className={iconBtn}
                        onClick={() => onRequery(row.requestId)}
                        aria-label={`Requery transaction ${row.requestId}`}
                        title="Requery transaction"
                      >
                        <FiRefreshCw />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>
                <div className="p-12 text-center text-xs text-muted">No transactions found.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
