import React, { useState } from "react";
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
  FaGamepad,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import logo from "../../assets/logo/new-dark.png";
import logoWhite from "../../assets/logo/logo-app.png";

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  const links = [
    { label: "Home", icon: FaHome, to: "/dashboard" },
    { label: "Transactions", icon: FaMoneyBillAlt, to: "/transactions" },
    { label: "Wallet", icon: FaWallet, to: "/wallet" },
    { label: "Referral", icon: FaUserFriends, to: "/referral" },
    { label: "User Ranking", icon: FaUserFriends, to: "/rank" },
    { label: "Dice Game", icon: FaGamepad, to: "/dice" },
    { label: "Settings", icon: FaCog, to: "/settings" },
    { label: "Help & Support", icon: FaQuestionCircle, to: "/support" },
  ];

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
        className={`fixed z-40 top-0 left-0 w-56 h-full p-6 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDarkMode
            ? "bg-gray-800 border-r border-gray-700"
            : "bg-white border-r border-gray-200"
        } shadow-xl`}
      >
        {/* Logo Section */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex justify-center items-center flex-1">
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
                      ? "bg-blue-600 text-white shadow-lg"
                      : `${
                          isDarkMode
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
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

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className={`text-xs ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          } text-center`}>
            © 2024 OhTopUp Inc.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;