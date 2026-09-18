import PropTypes from 'prop-types';
import { formatNairaAmount, formatPhoneNumber } from '../../../../utils';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transactionDetails, 
  isDarkMode,
  isLoading
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isLoading) {
      try {
        await onConfirm();
      } catch (error) {
      }
    }
  };

  return (
    <div className="ot-modal-overlay" onClick={onClose}>
      <div className="ot-modal ot-modal-md" onClick={e => e.stopPropagation()}>
        <div className="ot-modal-scroll" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Confirm Data Purchase</h3>
          <div style={{ color: 'var(--ot-muted)', marginBottom: 24, fontSize: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <span>Network:</span>
              <span style={{ fontWeight: 500, color: 'var(--ot-ink)' }}>{transactionDetails?.providerName}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <span>Phone Number:</span>
              <span style={{ fontWeight: 500, color: 'var(--ot-ink)' }}>{formatPhoneNumber(transactionDetails?.phoneNumber)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <span>Data Plan:</span>
              <span style={{ fontWeight: 500, color: 'var(--ot-ink)' }}>{transactionDetails?.planName}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <span>Amount:</span>
              <span style={{ fontWeight: 500, color: 'var(--ot-ink)' }}>{formatNairaAmount(transactionDetails?.amount)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} disabled={isLoading} className="ot-button ot-button-secondary">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={isLoading} className="ot-button ot-button-primary" style={{ minWidth: 120 }}>
              {isLoading ? 'Processing...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  transactionDetails: PropTypes.object,
  isDarkMode: PropTypes.bool,
  isLoading: PropTypes.bool
};

ConfirmationModal.defaultProps = {
  isLoading: false
};

export default ConfirmationModal;
