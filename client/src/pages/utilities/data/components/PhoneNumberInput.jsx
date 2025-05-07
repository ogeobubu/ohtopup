import PropTypes from 'prop-types';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { ErrorMessage, useField } from 'formik';

const PhoneNumberInput = ({ name, isDarkMode, disabled }) => {
  const [field, , helpers] = useField(name);

  return (
    <div className="flex flex-col">
      <label className="mb-2 block text-gray-500 dark:text-gray-300">Phone Number</label>
      <PhoneInput
        {...field}
        international
        defaultCountry="NG"
        value={field.value}
        onChange={(value) => helpers.setValue(value)}
        className={`w-full p-2 border rounded-lg ${
          isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        placeholder="Enter phone number"
        disabled={disabled}
      />
      <ErrorMessage
        name={name}
        component="div"
        className="text-red-500 text-sm mt-1"
      />
    </div>
  );
};

PhoneNumberInput.propTypes = {
  name: PropTypes.string.isRequired,
  isDarkMode: PropTypes.bool,
  disabled: PropTypes.bool
};

export default PhoneNumberInput;