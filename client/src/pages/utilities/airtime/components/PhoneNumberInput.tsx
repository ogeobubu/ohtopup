import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { ErrorMessage, useField } from 'formik';

const PhoneNumberInput = ({ name, isDarkMode, disabled, onNetworkDetected }) => {
  const [field, , helpers] = useField(name);
  const [detectedNetwork, setDetectedNetwork] = useState(null);

  // Network detection function
  const detectNetwork = (phoneNumber) => {
    if (!phoneNumber) return null;

    // Remove any non-numeric characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    // Extract the prefix (first 4 digits after country code)
    let prefix = '';
    if (cleanNumber.startsWith('234')) {
      // International format: +2348031234567 -> 0803
      prefix = '0' + cleanNumber.substring(3, 6);
    } else if (cleanNumber.startsWith('0')) {
      // Local format: 08031234567 -> 0803
      prefix = cleanNumber.substring(0, 4);
    } else {
      // Assume local format without leading zero
      prefix = '0' + cleanNumber.substring(0, 3);
    }

    // Map prefixes to networks
    const networkMap = {
      // MTN prefixes
      '0803': 'mtn', '0806': 'mtn', '0703': 'mtn', '0706': 'mtn',
      '0813': 'mtn', '0816': 'mtn', '0810': 'mtn', '0814': 'mtn',
      '0903': 'mtn', '0906': 'mtn',

      // Glo prefixes
      '0805': 'glo', '0807': 'glo', '0705': 'glo', '0815': 'glo',
      '0811': 'glo', '0905': 'glo',

      // Airtel prefixes
      '0802': 'airtel', '0808': 'airtel', '0708': 'airtel', '0812': 'airtel',
      '0701': 'airtel', '0902': 'airtel', '0907': 'airtel',

      // 9mobile prefixes
      '0809': '9mobile', '0817': '9mobile', '0818': '9mobile', '0908': '9mobile',
      '0909': '9mobile'
    };

    return networkMap[prefix] || null;
  };

  // Network display names
  const getNetworkDisplayName = (network) => {
    const displayNames = {
      'mtn': 'MTN',
      'glo': 'Glo',
      'airtel': 'Airtel',
      '9mobile': '9mobile'
    };
    return displayNames[network] || network?.toUpperCase();
  };

  // Network colors for UI
  const getNetworkColor = (network) => {
    const colors = {
      'mtn': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'glo': 'bg-green-100 text-green-800 border-green-300',
      'airtel': 'bg-red-100 text-red-800 border-red-300',
      '9mobile': 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[network] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Detect network when phone number changes
  useEffect(() => {
    const network = detectNetwork(field.value);
    setDetectedNetwork(network);

    // Call the callback if provided
    if (onNetworkDetected) {
      onNetworkDetected(network);
    }
  }, [field.value, onNetworkDetected]);

  return (
    <div className="flex flex-col">
      <label className="mb-2 block text-gray-500 dark:text-gray-300">
        Phone Number
      </label>

      <div className="relative">
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

        {/* Network detection indicator */}
        {detectedNetwork && field.value && (
          <div className={`absolute right-2 top-2 px-2 py-1 rounded-full text-xs font-medium border ${getNetworkColor(detectedNetwork)}`}>
            {getNetworkDisplayName(detectedNetwork)}
          </div>
        )}
      </div>

      {/* Network detection message */}
      {detectedNetwork && field.value && (
        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
          ✓ Detected {getNetworkDisplayName(detectedNetwork)} network
        </div>
      )}

      {/* Unknown network warning */}
      {!detectedNetwork && field.value && field.value.length >= 10 && (
        <div className="mt-2 text-sm text-orange-600 dark:text-orange-400">
          ⚠ Unable to detect network. Please verify the phone number.
        </div>
      )}

      <ErrorMessage
        name={name}
        component="div"
        className="text-red-500 text-sm mt-1"
      />

      {/* Network information */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Supported networks: MTN, Glo, Airtel, 9mobile
      </div>
    </div>
  );
};

PhoneNumberInput.propTypes = {
  name: PropTypes.string.isRequired,
  isDarkMode: PropTypes.bool,
  disabled: PropTypes.bool,
  onNetworkDetected: PropTypes.func
};

PhoneNumberInput.defaultProps = {
  onNetworkDetected: null
};

export default PhoneNumberInput;