import { FiX } from 'react-icons/fi';

export default function PurchaseHeader({ title, step, total, onClose }: {
  title: string; step: number; total: number; onClose: () => void;
}) {
  return <div className="ot-purchase-header">
    <div><h2>{title}</h2><p>Step {step} of {total}</p></div>
    <button type="button" className="ot-icon-button" onClick={onClose} aria-label="Close purchase"><FiX /></button>
  </div>;
}
