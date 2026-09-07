import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const Button = ({
  variant = 'primary',
  children,
  onClick = () => {},
  className = '',
  darkMode = false,
  disabled = false,
  loading = false,
  size = 'lg',
  onSuccess = () => {},
  ...props
}) => {
  const getButtonStyles = () => variant === 'danger' ? 'ot-button-danger' : variant === 'secondary' ? 'ot-button-secondary' : 'ot-button-primary';

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

  const handleClick = () => {
    if (!disabled && !loading) {
      onClick && onClick();
      onSuccess && onSuccess();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`ot-button
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