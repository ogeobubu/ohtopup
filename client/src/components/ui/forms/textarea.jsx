import React, { useState } from "react";
import { toast } from "react-toastify";

const TextareaInput = ({
  placeholder,
  value,
  onChange,
  label,
  error,
  name,
  rows = 4,
}) => {
  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => {
      onChange(text);
      toast.success("Text pasted successfully!");
    });
  };

  return (
    <div className="mb-4">
      {label && <label className="block text-gray-500 mb-2">{label}</label>}
      <div className="relative">
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
          className={`w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
            error
              ? "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500"
              : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
          }`}
        />
        {label === "Description (Optional)" && (
          <button
            type="button"
            onClick={handlePaste}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 font-semibold"
          >
            Paste
          </button>
        )}
      </div>
    </div>
  );
};

export default TextareaInput;
