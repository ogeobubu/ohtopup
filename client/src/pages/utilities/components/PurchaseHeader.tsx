import { FiX } from "react-icons/fi";

export default function PurchaseHeader({
  title,
  step,
  total,
  onClose,
}: {
  title: string;
  step: number;
  total: number;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-[-0.4px]">{title}</h2>
        <p className="mt-0.5 text-xs text-muted">
          Step {step} of {total}
        </p>
      </div>
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-tint hover:text-ink"
        onClick={onClose}
        aria-label="Close purchase"
      >
        <FiX />
      </button>
    </div>
  );
}
