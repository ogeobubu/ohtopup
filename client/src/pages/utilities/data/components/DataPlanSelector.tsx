import PropTypes from 'prop-types';
import Select from 'react-select';
import useDataVariations from '../hooks/useDataVariations';

const DataPlanSelector = ({ providerId, isDarkMode, onChange, value }) => {
  const { data: options, isLoading, error } = useDataVariations(providerId);

  if (isLoading) {
    return (
      <div style={{ height: 48, background: 'var(--ot-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--ot-muted)', fontSize: 13 }}>Loading plans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 12, background: 'var(--ot-tint)', borderRadius: 8, color: '#b84545', fontSize: 13 }}>
        Failed to load data plans. Please try again.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label className="ot-field-label">Data Plan</label>
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

DataPlanSelector.propTypes = {
  providerId: PropTypes.string,
  isDarkMode: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object
};

export default DataPlanSelector;
