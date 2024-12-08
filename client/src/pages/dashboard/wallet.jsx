import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaAngleDown, FaEye, FaEyeSlash, FaBuilding } from "react-icons/fa";

const Wallet = ({ data }) => {
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState("NGN");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const dropdownRef = useRef(null);

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

  const balanceArray =
    showBalance && data?.balance
      ? data.balance.toFixed(2).toString().split(".")
      : ["***", ""];

  return (
    <div className="bg-[#F7F9FB] p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row items-start justify-between mb-4">
        <h2 className="text-2xl text-[#0B2253] font-bold flex items-center">
          <span className="text-lg">₦</span>
          <span className="text-2xl font-bold">{balanceArray[0]}</span>
          <span className="text-lg font-medium">.{balanceArray[1]}</span>
          <button
            className="ml-4 text-[#0B2253] focus:outline-none"
            onClick={toggleBalanceVisibility}
            aria-label={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? <FaEyeSlash /> : <FaEye />}
          </button>
        </h2>
        <div
          className="relative inline-block text-left mt-4 md:mt-0"
          ref={dropdownRef}
        >
          <button
            type="button"
            className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-[#0B2253] bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
            id="options-menu"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            onClick={handleDropdownToggle}
          >
            {selectedCurrency}
            <FaAngleDown className="w-5 h-5 ml-2" aria-hidden="true" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div
                className="py-1"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-[#0B2253] hover:bg-gray-100 hover:text-gray-900"
                  role="menuitem"
                  onClick={() => handleCurrencyChange("NGN")}
                >
                  NGN
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => navigate("/wallet")}
        className="bg-[#D9E4FB] flex items-center hover:bg-blue-300 text-blue-600 font-bold py-2 px-4 rounded"
      >
        <div className="w-4 h-4 rounded-full bg-blue-600 flex justify-center items-center mr-2">
          <FaBuilding size={10} className="text-white" />
        </div>
        Withdraw
      </button>
    </div>
  );
};

export default Wallet;
