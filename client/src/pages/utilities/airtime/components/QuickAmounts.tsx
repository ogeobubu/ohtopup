import PropTypes from 'prop-types';

const QuickAmounts = ({ amounts, selectedAmount, onChange, isSubmitting }) => {
  return (
    <div>
      <label className="ot-field-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <svg style={{ width: 16, height: 16, color: 'var(--ot-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Amounts
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {amounts.map((value) => (
          <button
            key={value}
            type="button"
            style={{
              padding: 12, borderRadius: 8, fontWeight: 500, fontSize: 16,
              border: selectedAmount === value ? '2px solid var(--ot-accent)' : '2px solid var(--ot-line)',
              background: selectedAmount === value ? 'var(--ot-tint)' : 'var(--ot-paper)',
              color: selectedAmount === value ? 'var(--ot-accent)' : 'var(--ot-ink)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1,
              transition: 'all 0.15s'
            }}
            onClick={() => onChange(value)}
            disabled={isSubmitting}
          >
            ₦{value.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );
};

QuickAmounts.propTypes = {
  amounts: PropTypes.arrayOf(PropTypes.number),
  selectedAmount: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

QuickAmounts.defaultProps = {
  amounts: [100, 200, 500, 1000]
};

export default QuickAmounts;
