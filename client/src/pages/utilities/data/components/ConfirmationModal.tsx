import { formatNairaAmount, formatPhoneNumber } from '../../../../utils';

type Details = { providerName?: string; phoneNumber?: string; planName?: string; amount?: number } | undefined;
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  transactionDetails?: Details;
  isLoading?: boolean;
};

const row = 'grid grid-cols-2 gap-3 mb-3 last:mb-0';
const label = '';
const value = 'font-medium text-ink';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, transactionDetails, isLoading = false }: Props) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isLoading) {
      try {
        await onConfirm();
      } catch {
        // error surfaces via parent toast
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.55)] p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-[420px] overflow-hidden rounded-lg border border-line bg-paper shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <h3 className="mb-4 text-[17px] font-semibold">Confirm Data Purchase</h3>
          <div className="mb-6 text-[13px] text-muted">
            <div className={row}>
              <span className={label}>Network:</span>
              <span className={value}>{transactionDetails?.providerName}</span>
            </div>
            <div className={row}>
              <span className={label}>Phone Number:</span>
              <span className={value}>{formatPhoneNumber(transactionDetails?.phoneNumber)}</span>
            </div>
            <div className={row}>
              <span className={label}>Data Plan:</span>
              <span className={value}>{transactionDetails?.planName}</span>
            </div>
            <div className={row}>
              <span className={label}>Amount:</span>
              <span className={value}>{formatNairaAmount(transactionDetails?.amount)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex min-h-[46px] items-center justify-center rounded-md border border-line bg-paper px-[15px] py-[11px] text-[13px] font-semibold text-ink transition hover:bg-tint disabled:opacity-45"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="inline-flex min-h-[46px] min-w-[120px] items-center justify-center rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark disabled:opacity-45"
            >
              {isLoading ? 'Processing...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
