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
import logo from "../../assets/logo/ohtopup-high-resolution-logo-transparent.png";

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { label: "Home", icon: FaHome, to: "/dashboard" },
    { label: "Transactions", icon: FaMoneyBillAlt, to: "/transactions" },
    { label: "Wallet", icon: FaWallet, to: "/wallet" },
    { label: "Referral", icon: FaUserFriends, to: "/referral" },
    { label: "User Ranking", icon: FaUserFriends, to: "/dashboard" },
    { label: "Settings", icon: FaCog, to: "/settings" },
    { label: "Help & Support", icon: FaQuestionCircle, to: "/dashboard" },
  ];

  return (
    <div className="absolute">
      <div className="md:hidden flex items-center justify-between p-4 absolute z-1">
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-800">
          <FaBars size={24} />
        </button>
      </div>

      <div
        className={`fixed z-10 top-0 left-0 w-56 bg-[#F7F9FB] text-gray-800 h-full p-6 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 md:block`}
      >
        <div className="mb-4 flex justify-between items-center">
          <img
            src={logo}
            alt="Logo"
            className="w-auto h-12 mx-auto"
          />
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
                      ? "bg-blue-600 rounded-md px-4 py-2 text-white"
                      : "text-gray-500 hover:bg-blue-600 hover:text-white rounded-md px-4 py-2 transition-colors duration-200"
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