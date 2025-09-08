export const formatNairaAmount = (amount) => {
  const numericValue = typeof amount === 'number' ? amount : parseFloat(amount?.replace(/₦|,/g, '').trim());

  if (isNaN(numericValue)) {
    return '₦0.00';
  }

  const formattedValue = numericValue.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `₦${formattedValue}`;
};

export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';

  // Remove any non-digit characters except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

  // If already starts with +234, convert to 0 format for server
  if (cleanPhone.startsWith('+234')) {
    return '0' + cleanPhone.substring(4);
  }

  // If starts with 234, convert to 0 format
  if (cleanPhone.startsWith('234')) {
    return '0' + cleanPhone.substring(3);
  }

  // If already starts with 0, return as is
  if (cleanPhone.startsWith('0')) {
    return cleanPhone;
  }

  // If it's just the 10-digit number, add 0 prefix
  if (cleanPhone.length === 10) {
    return '0' + cleanPhone;
  }

  // Return as is if none of the above (shouldn't happen with valid Nigerian numbers)
  return cleanPhone;
};

export const customStyles = {
  control: (provided) => ({
    ...provided,
    borderColor: "#d1d5db",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    backgroundColor: "#f9fafb",
    padding: "0.3rem",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#e0f2fe" : "#ffffff",
    color: "#111827",
    padding: "0.5rem 1rem",
    "&:active": {
      backgroundColor: "#bfdbfe",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#111827",
  }),
};