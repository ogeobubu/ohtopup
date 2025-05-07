import PropTypes from 'prop-types';

const QuickAmounts = ({ amounts, selectedAmount, onChange, isSubmitting }) => {
  return (
    <div className="mt-1">
      <h3 className="text-gray-700 dark:text-gray-300 mb-2">Quick Amounts</h3>
      <div className="grid grid-cols-2 gap-4">
        {amounts.map((value) => (
          <button
            key={value}
            className={`p-2 border rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
              selectedAmount === value ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => onChange(value)}
            disabled={isSubmitting}
            type="button"
          >
            ₦{value}
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