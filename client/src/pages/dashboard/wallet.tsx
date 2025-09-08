import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaAngleDown, FaEye, FaEyeSlash, FaBuilding } from "react-icons/fa";
import { useSelector } from "react-redux";

const Wallet = ({ data }) => {
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState("NGN");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true); // Default to true to show balance
  const dropdownRef = useRef(null);
  const isDarkMode = useSelector(state => state.theme.isDarkMode);

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    setIsDropdownOpen(false);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const toggleBalanceVisibility = () => {
    setShowBalance((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Ensure balance is always formatted unless showBalance is false
  const formattedBalance = showBalance
    ? (data?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "***";

  // Handle loading state when wallet is being created
  if (!data && !isDarkMode) {
    return (
      <div className="p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-gray-600">Setting up your wallet...</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl shadow-sm border h-full flex flex-col ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <span className="text-blue-600 text-lg">💰</span>
          </div>
          <div>
            <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Wallet Balance</h3>
          </div>
        </div>
        <button
          onClick={toggleBalanceVisibility}
          className={`p-1.5 rounded-md transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          aria-label={showBalance ? "Hide balance" : "Show balance"}
        >
          {showBalance ? <FaEyeSlash className="text-gray-500 text-sm" /> : <FaEye className="text-gray-500 text-sm" />}
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline space-x-1">
          <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₦</span>
          <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formattedBalance}</span>
        </div>
      </div>

      <div className="mt-auto">
        <button
          onClick={() => navigate("/wallet")}
          className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } shadow-sm hover:shadow-md`}
        >
          <FaBuilding className="mr-2 text-sm" />
          Manage
        </button>
      </div>
    </div>
  );
};

export default Wallet;