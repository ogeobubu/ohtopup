import React from 'react';
import { FaSpinner } from 'react-icons/fa'; // Importing a spinner icon

const Button = ({
  variant = 'primary',
  children,
  onClick,
  className = '',
  darkMode = false,
  disabled = false,
  loading = false,
  size = 'lg',
  ...props
}) => {
  const getButtonStyles = () => {
    if (disabled || loading) {
      return 'bg-gray-400 text-gray-200 cursor-not-allowed';
    }

    switch (variant) {
      case 'primary':
        return darkMode
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'secondary':
        return darkMode
          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700';
      case 'danger':
        return darkMode
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return '';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'lg':
        return 'w-full';
      case 'md':
        return 'w-full md:w-48';
      case 'sm':
        return 'w-full md:w-32';
      default:
        return 'w-full md:w-48';
    }
  };

  return (
    <button
      onClick={disabled || loading ? null : onClick}
      className={`font-semibold py-2 rounded-lg shadow-lg transition duration-300 ease-in-out transform flex items-center justify-center
        ${getButtonStyles()} ${getSizeStyles()} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <FaSpinner className="animate-spin mr-2" />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;