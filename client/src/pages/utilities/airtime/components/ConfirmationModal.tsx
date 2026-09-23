import { formatNairaAmount, formatPhoneNumber } from '../../../../utils';

type Details = { providerName?: string; phoneNumber?: string; amount?: number } | undefined;
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  transactionDetails?: Details;
  isLoading?: boolean;
};

const row = 'flex items-center justify-between gap-4 border-b border-line py-2.5 last:border-b-0';
const label = 'text-[13px] text-muted';
const value = 'text-right font-semibold';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, transactionDetails, isLoading = false }: Props) => {
  const handleConfirm = async () => {
    if (!isLoading) {
      try {
        await onConfirm();
      } catch (error) {
        console.error('Purchase confirmation failed:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.55)] p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-[420px] overflow-hidden rounded-lg border border-line bg-paper shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tint">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-1 text-[22px] font-bold">Confirm Purchase</h3>
            <p className="text-[13px] text-muted">Please review your airtime purchase details</p>
          </div>

          <div className="mb-6 rounded-lg bg-bg p-5">
            <div className={row}>
              <span className={label}>Network Provider</span>
              <span className={`${value} text-[17px]`}>{transactionDetails?.providerName}</span>
            </div>
            <div className={row}>
              <span className={label}>Phone Number</span>
              <span className={`${value} text-sm`}>{formatPhoneNumber(transactionDetails?.phoneNumber)}</span>
            </div>
            <div className={row}>
              <span className={label}>Amount</span>
              <span className={`${value} text-[17px] font-bold text-success dark:text-success-dark`}>
                {formatNairaAmount(transactionDetails?.amount)}
              </span>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-[#ffc107] bg-[#fef3cd] p-4 text-[13px] leading-relaxed">
            <strong>Important Notice</strong> — Please ensure the phone number and amount are correct. This action cannot be undone.
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-md border border-line bg-paper px-[15px] py-[11px] text-[13px] font-semibold text-ink transition hover:bg-tint disabled:opacity-45"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark disabled:opacity-45"
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
