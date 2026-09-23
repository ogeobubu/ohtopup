import Select from 'react-select';
import useDataVariations from '../hooks/useDataVariations';

type Props = {
  providerId?: string;
  isDarkMode?: boolean;
  onChange: (value: any) => void;
  value?: object;
};

const DataPlanSelector = ({ providerId, isDarkMode = false, onChange, value }: Props) => {
  const { data: options, isLoading, error } = useDataVariations(providerId);

  if (isLoading) {
    return (
      <div className="mb-4 flex h-12 items-center justify-center rounded-lg bg-bg">
        <span className="text-[13px] text-muted">Loading plans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 rounded-lg bg-tint p-3 text-[13px] text-danger dark:text-danger-dark">
        Failed to load data plans. Please try again.
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="mb-2 block text-xs font-semibold text-ink">Data Plan</label>
      <Select
        options={options}
        onChange={onChange}
        value={value}
        placeholder="Select data plan"
        classNamePrefix="select"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: isDarkMode ? '#1a232c' : '#ffffff',
            borderColor: isDarkMode ? '#303b46' : '#e2e6e9',
            color: isDarkMode ? '#e9edf1' : '#18232d',
            minHeight: '44px',
          }),
          placeholder: (base) => ({
            ...base,
            color: isDarkMode ? '#a5afb9' : '#626d79',
          }),
          singleValue: (base) => ({
            ...base,
            color: isDarkMode ? '#e9edf1' : '#18232d',
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: isDarkMode ? '#1a232c' : '#ffffff',
          }),
          option: (base, { isFocused }) => ({
            ...base,
            backgroundColor: isFocused
              ? isDarkMode ? '#243245' : '#eef2fa'
              : isDarkMode ? '#1a232c' : '#ffffff',
            color: isDarkMode ? '#e9edf1' : '#18232d',
          }),
        }}
      />
    </div>
  );
};

export default DataPlanSelector;
