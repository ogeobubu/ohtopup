import React, { useState, useId } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";

interface FormInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
  label?: string;
  error?: any;
  name?: string;
  min?: string;
  disabled?: boolean;
  helperText?: string;
  isDarkMode?: boolean;
  onBlur?: (e: any) => void;
}

const FormInput: React.FC<FormInputProps> = ({
  type = "text",
  placeholder,
  value,
  onChange,
  label,
  error,
  name,
  min,
  disabled = false,
  helperText,
  isDarkMode,
  onBlur,
}) => {
  const id = useId();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => {
      onChange?.({ target: { name, value: text } });
      toast.success("Text pasted successfully!");
    }).catch(() => toast.error("Please paste directly into the field."));
  };

  return (
    <div className="mb-4">
      {label && <label htmlFor={id} className="mb-[7px] block text-xs font-mediumish text-ink">{label}</label>}
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || helperText ? `${id}-message` : undefined}
          name={name}
          type={type === "password" && isPasswordVisible ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          min={min}
          disabled={disabled}
          className="block min-h-[46px] w-full min-w-0 max-w-full rounded-control border border-line bg-paper px-3 py-[10px] text-sm text-ink outline-none focus:outline-2 focus:outline-accent focus:outline-offset-1 aria-[invalid=true]:border-danger disabled:opacity-50 pr-16"
        />

        {label === "Referral Code (Optional)" && (
          <button
            type="button"
            onClick={handlePaste}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 font-semibold"
          >
            Paste
          </button>
        )}
        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            {isPasswordVisible ? (
              <AiFillEyeInvisible className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            ) : (
              <AiFillEye className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            )}
          </button>
        )}
      </div>
      {(error || helperText) && <p id={`${id}-message`} className={error ? "mt-[5px] text-[11px] text-danger" : "mt-1 text-xs text-gray-500"}>{error || helperText}</p>}
    </div>
  );
};

export default FormInput;