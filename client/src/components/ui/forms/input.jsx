import React, { useState } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";

const FormInput = ({
  type,
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
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => {
      onChange(text);
      toast.success("Text pasted successfully!");
    });
  };

  return (
    <div className="mb-4">
      {label && <label className={`block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{label}</label>}
      <div className="relative">
        <input
          name={name}
          type={type === "password" && isPasswordVisible ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          min={min}
          disabled={disabled}
          className={`w-full p-2 border rounded bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 pr-16 ${
            error
              ? "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500"
              : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
          }`}
        />
        {helperText && <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{helperText}</span>}
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
    </div>
  );
};

export default FormInput;