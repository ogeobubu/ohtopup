import PropTypes from 'prop-types';
import Select from 'react-select';
import useDataVariations from '../hooks/useDataVariations';

const DataPlanSelector = ({ providerId, isDarkMode, onChange, value }) => {
  const { data: options, isLoading, error } = useDataVariations(providerId);

  if (isLoading) {
    return (
      <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">Loading plans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-300">
        Failed to load data plans. Please try again.
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-gray-500 dark:text-gray-300 mb-2">Data Plan</label>
      <Select
        options={options}
        onChange={onChange}
        value={value}
        placeholder="Select data plan"
        classNamePrefix="select"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: isDarkMode ? '#2d3748' : '#ffffff',
            borderColor: isDarkMode ? '#4a5568' : '#d1d5db',
            color: isDarkMode ? '#cbd5e0' : '#000000',
            minHeight: '44px',
          }),
          placeholder: (base) => ({
            ...base,
            color: isDarkMode ? '#a0aec0' : '#9ca3af',
          }),
          singleValue: (base) => ({
            ...base,
            color: isDarkMode ? '#cbd5e0' : '#000000',
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: isDarkMode ? '#2d3748' : '#ffffff',
          }),
          option: (base, { isFocused }) => ({
            ...base,
            backgroundColor: isFocused
              ? isDarkMode
                ? '#4a5568'
                : '#e5f3ff'
              : isDarkMode
              ? '#2d3748'
              : '#ffffff',
            color: isDarkMode ? '#cbd5e0' : '#000000',
          }),
        }}
      />
    </div>
  );
};

DataPlanSelector.propTypes = {
  providerId: PropTypes.string,
  isDarkMode: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object
};

export default DataPlanSelector;