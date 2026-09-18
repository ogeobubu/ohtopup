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
    <div className="ot-modal-overlay" onClick={onClose}>
      <div className="ot-modal ot-modal-md" onClick={e => e.stopPropagation()}>
        <div className="ot-modal-scroll" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--ot-tint)', marginBottom: 16 }}>
              <svg style={{ width: 32, height: 32, color: 'var(--ot-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Confirm Purchase</h3>
            <p style={{ color: 'var(--ot-muted)', fontSize: 13 }}>Please review your airtime purchase details</p>
          </div>

          <div style={{ background: 'var(--ot-bg)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--ot-line)' }}>
              <span style={{ color: 'var(--ot-muted)', fontSize: 13 }}>Network Provider</span>
              <span style={{ fontWeight: 600, fontSize: 17 }}>{transactionDetails?.providerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--ot-line)' }}>
              <span style={{ color: 'var(--ot-muted)', fontSize: 13 }}>Phone Number</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{formatPhoneNumber(transactionDetails?.phoneNumber)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <span style={{ color: 'var(--ot-muted)', fontSize: 13 }}>Amount</span>
              <span style={{ fontWeight: 700, fontSize: 17, color: '#27805d' }}>{formatNairaAmount(transactionDetails?.amount)}</span>
            </div>
          </div>

          <div style={{ background: '#fef3cd', border: '1px solid #ffc107', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 13, lineHeight: 1.6 }}>
            <strong>Important Notice</strong> — Please ensure the phone number and amount are correct. This action cannot be undone.
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} disabled={isLoading} className="ot-button ot-button-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={isLoading} className="ot-button ot-button-primary" style={{ flex: 1, background: '#27805d' }}>
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
