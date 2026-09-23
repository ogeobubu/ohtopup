type Props = {
  amounts?: number[];
  selectedAmount?: number;
  onChange: (value: number) => void;
  isSubmitting?: boolean;
};

const QuickAmounts = ({ amounts = [100, 200, 500, 1000], selectedAmount, onChange, isSubmitting }: Props) => {
  return (
    <div>
      <label className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-ink">
        <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Amounts
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        {amounts.map((value) => {
          const selected = selectedAmount === value;
          return (
            <button
              key={value}
              type="button"
              className={[
                'rounded-lg border-2 p-3 text-base font-medium transition',
                selected ? 'border-accent bg-tint text-accent' : 'border-line bg-paper text-ink',
                isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              ].join(' ')}
              onClick={() => onChange(value)}
              disabled={isSubmitting}
            >
              ₦{value.toLocaleString()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAmounts;
