export default function Status({ status }: { status: string }) {
  const value = (status || 'unknown').toLowerCase();
  const tone = ['delivered', 'completed', 'successful', 'approved', 'active'].includes(value) ? 'success' : ['failed', 'rejected', 'cancelled', 'inactive'].includes(value) ? 'failed' : 'pending';
  return <span className={`ot-status ot-status-${tone}`}>{value.replace(/_/g, ' ').replace(/^./, letter => letter.toUpperCase())}</span>;
}
