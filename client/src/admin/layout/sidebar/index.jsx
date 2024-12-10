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
} from "react-icons/fa";
import logo from "../../../assets/logo/ohtopup-high-resolution-logo-transparent.png";
import logoWhite from "../../../assets/logo/logo-color.svg";
import { useSelector } from "react-redux";

const Sidebar = () => {
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { label: "Home", icon: FaHome, to: "/admin/dashboard" },
    { label: "Transactions", icon: FaMoneyBillAlt, to: "/admin/transactions" },
    { label: "Wallet", icon: FaWallet, to: "/admin/wallet" },
    { label: "Referral", icon: FaUserFriends, to: "/admin/referral" },
    { label: "User Management", icon: FaUserFriends, to: "/admin/users" },
    { label: "Settings", icon: FaCog, to: "/admin/settings" },
    { label: "Waitlist", icon: FaQuestionCircle, to: "/admin/waitlist" },
    { label: "Help & Support", icon: FaQuestionCircle, to: "/admin/support" },
  ];

  return (
    <div className="absolute">
      <div className="md:hidden flex items-center justify-between p-4 absolute z-1">
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-800">
          <FaBars size={24} />
        </button>
      </div>

      <div
        className={`fixed z-10 top-0 left-0 w-56 h-full p-6 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 md:block`}
        style={{
          backgroundColor: isDarkMode ? "#2D3748" : "#F7F9FB",
          color: isDarkMode ? "#E2E8F0" : "#4A5568",
        }}
      >
        <div className="mb-4 flex justify-between items-center">
        {isDarkMode ? (
            <img src={logoWhite} alt="Logo" className="w-auto h-12 mx-auto" />
          ) : (
            <img src={logo} alt="Logo" className="w-auto h-12 mx-auto" />
          )}
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-800">
            <FaTimes size={24} />
          </button>
        </div>

        <nav className="overflow-y-auto max-h-[calc(100vh-100px)]"> {/* Adjust max height as necessary */}
          <ul className="space-y-4">
            {links.map((link, index) => (
              <li key={index}>
                <Link
                  to={link.to}
                  className={`flex items-center space-x-4 ${
                    location.pathname === link.to
                      ? "bg-green-600 rounded-md px-4 py-2 text-white"
                      : "text-gray-500 hover:bg-green-600 hover:text-white rounded-md px-4 py-2 transition-colors duration-200"
                  }`}
                >
                  <link.icon className="w-3 h-3" />
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;