import React from 'react';
import { FaSpinner } from 'react-icons/fa';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'light';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark',
  secondary: 'bg-paper border border-line text-ink hover:bg-tint',
  danger: 'bg-danger text-white hover:opacity-90',
  light: 'bg-white text-[#18232d] hover:bg-[#e9edfa]',
};

const sizeClasses: Record<string, string> = {
  lg: 'w-full',
  md: 'w-full md:w-48',
  sm: 'w-full md:w-32',
};

interface ButtonProps {
  variant?: ButtonVariant;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  darkMode?: boolean;
  disabled?: boolean;
  loading?: boolean;
  size?: 'lg' | 'md' | 'sm';
  onSuccess?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({
  variant = 'primary',
  children,
  onClick = () => {},
  className = '',
  disabled = false,
  loading = false,
  size = 'lg',
  onSuccess = () => {},
  ...props
}: ButtonProps) => {
  const handleClick = () => {
    if (!disabled && !loading) {
      if (onClick) onClick();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={[
        'inline-flex min-h-[46px] items-center justify-center gap-4 rounded-[6px] border border-transparent px-[19px] py-[11px] text-sm font-semibold transition-[background,border-color] duration-150 disabled:opacity-50',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <FaSpinner className="mr-2 animate-spin" /> : children}
    </button>
  );
};

export default Button;
