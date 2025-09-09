import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaMoneyBillAlt,
  FaWallet,
  FaUserFriends,
  FaCog,
  FaQuestionCircle,
  FaBars,
  FaTimes,
  FaEnvelope,
  FaFileAlt,
  FaTrophy,
  FaNetworkWired,
  FaBook,
  FaBullseye,
} from "react-icons/fa";
import logo from "../../../assets/logo/ohtopup-high-resolution-logo-transparent.png";
import logoWhite from "../../../assets/logo/logo-color.svg";
import { useSelector } from "react-redux";

const Sidebar = () => {
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef(null);

  const links = [
    { label: "Home", icon: FaHome, to: "/admin/dashboard" },
    { label: "Transactions", icon: FaMoneyBillAlt, to: "/admin/transactions" },
    { label: "Wallet", icon: FaWallet, to: "/admin/wallet" },
    { label: "Referral", icon: FaUserFriends, to: "/admin/referral" },
    { label: "Users", icon: FaUserFriends, to: "/admin/users" },
    { label: "Ranking", icon: FaTrophy, to: "/admin/ranking" },
    { label: "Bet Dice Game", icon: FaBullseye, to: "/admin/bet-dice" },
    { label: "Providers", icon: FaNetworkWired, to: "/admin/providers" },
    { label: "Tutorials", icon: FaBook, to: "/admin/tutorials" },
    { label: "Newsletter", icon: FaEnvelope, to: "/admin/newsletter" },
    { label: "System Logs", icon: FaFileAlt, to: "/admin/logs" },
    { label: "Settings", icon: FaCog, to: "/admin/settings" },
    { label: "Help & Support", icon: FaQuestionCircle, to: "/admin/support" },
  ];

  const handleClickOutside = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-lg shadow-lg transition-colors duration-200 ${
            isDarkMode
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-white text-gray-800 hover:bg-gray-50"
          }`}
        >
          <FaBars size={20} />
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed z-40 top-0 left-0 w-56 h-full p-4 transform transition-transform duration-300 ease-in-out md:translate-x-0 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDarkMode
            ? "bg-gray-800 border-r border-gray-700"
            : "bg-white border-r border-gray-200"
        } shadow-xl`}
      >
        {/* Logo Section */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center">
            {isDarkMode ? (
              <img src={logoWhite} alt="Logo" className="w-auto h-10" />
            ) : (
              <img src={logo} alt="Logo" className="w-auto h-10" />
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {links.map((link, index) => (
              <li key={index}>
                <Link
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    location.pathname === link.to
                      ? "bg-green-600 text-white shadow-lg"
                      : `${
                          isDarkMode
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-600 hover:bg-green-50 hover:text-green-600"
                        }`
                  }`}
                >
                  <link.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{link.label}</span>
                  {location.pathname === link.to && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Admin Status */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className={`flex items-center space-x-2 text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Admin Online</span>
          </div>
          <div className={`text-xs mt-2 ${
            isDarkMode ? "text-gray-500" : "text-gray-400"
          } text-center`}>
            © 2024 OhTopUp Inc.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;