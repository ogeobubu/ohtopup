import PropTypes from 'prop-types';

const QuickAmounts = ({ amounts, selectedAmount, onChange, isSubmitting }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-[var(--ot-ink)]  font-medium flex items-center">
        <svg className="h-4 w-4 mr-2 text-[var(--ot-accent)] dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Amounts
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {amounts.map((value) => (
          <button
            key={value}
            className={`p-3 border-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
              selectedAmount === value
                ? 'border-blue-500 bg-[var(--ot-tint)] dark:bg-blue-900/30 text-[var(--ot-accent)] dark:text-blue-300 shadow-md'
                : 'border-[var(--ot-line)]  bg-[var(--ot-paper)]  text-[var(--ot-ink)]  hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onChange(value)}
            disabled={isSubmitting}
            type="button"
          >
            <span className="text-lg font-semibold">₦{value.toLocaleString()}</span>
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