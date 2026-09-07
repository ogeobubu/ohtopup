import { Link } from 'react-router-dom';
import { FiRefreshCw, FiArrowUpRight } from 'react-icons/fi';
import { formatNairaAmount } from '../../utils';
import Status from './status';

type Transaction = { _id?: string; requestId: string; product_name: string; status: string; amount: number; phone: string; createdAt: string };
export default function TransactionTable({ data = [], onRequery }: { data: Transaction[]; onRequery?: (reference: string) => void }) {
  return <div className="ot-admin-table-wrap"><table className="ot-admin-table"><thead><tr>{['Product', 'Status', 'Amount', 'Recipient', 'Date', 'Actions'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
    {data.length ? data.map(row => <tr key={row._id || row.requestId}>
      <td><strong className="font-medium">{row.product_name}</strong><small className="ot-admin-table-reference">{row.requestId}</small></td>
      <td><Status status={row.status} /></td><td className="whitespace-nowrap">{formatNairaAmount(row.amount)}</td><td>{row.phone}</td><td className="whitespace-nowrap">{new Date(row.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
      <td><div className="flex items-center gap-1"><Link className="ot-icon-button" to={`/admin/transactions/${encodeURIComponent(row.requestId)}`} aria-label={`View transaction ${row.requestId}`} title="View transaction"><FiArrowUpRight /></Link>{row.status !== 'delivered' && onRequery && <button className="ot-icon-button" onClick={() => onRequery(row.requestId)} aria-label={`Requery transaction ${row.requestId}`} title="Requery transaction"><FiRefreshCw /></button>}</div></td>
    </tr>) : <tr><td colSpan={6}><div className="ot-empty">No transactions found.</div></td></tr>}
  </tbody></table></div>;
}
