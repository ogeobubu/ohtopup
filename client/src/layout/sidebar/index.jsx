import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaMoneyBillAlt,
  FaWallet,
  FaUserFriends,
  FaCog,
  FaQuestionCircle,
} from "react-icons/fa";
import logo from "../../assets/logo/ohtopup-high-resolution-logo-transparent.png"

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { label: "Home", icon: FaHome, to: "/dashboard" },
    { label: "Transactions", icon: FaMoneyBillAlt, to: "/transactions" },
    { label: "Wallet", icon: FaWallet, to: "/wallet" },
    { label: "Referral", icon: FaUserFriends, to: "/referral" },
    { label: "User Ranking", icon: FaUserFriends, to: "/user-ranking" },
    { label: "Settings", icon: FaCog, to: "/settings" },
    { label: "Help & Support", icon: FaQuestionCircle, to: "/help" },
  ];

  return (
    <div className="fixed top-0 left-0 hidden md:block bg-[#F7F9FB] text-gray-800 h-screen p-6">
      <div className="mb-8">
        <img
          src={logo}
          alt="Logo"
          className="w-auto h-12 mx-auto"
        />
      </div>
      <nav>
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
  );
};

export default Sidebar;
