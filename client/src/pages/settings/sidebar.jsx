import React from "react";
import { useSelector } from "react-redux"; // Import useSelector
import {
  FaUserCircle,
  FaCog,
  FaShieldAlt,
  FaBell,
  FaCheckCircle,
} from "react-icons/fa";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const isDarkMode = useSelector((state) => state.theme.isDarkMode); 
  const tabs = [
    {
      label: "Profile and KYC Settings",
      subtitle: "View and edit your profile.",
      icon: FaUserCircle,
      name: "Profile",
    },
    {
      label: "General Settings",
      subtitle: "General settings and themes.",
      icon: FaCog,
      name: "General",
    },
    {
      label: "Security Settings",
      subtitle: "Update PIN and Password.",
      icon: FaShieldAlt,
      name: "Security",
    },
    {
      label: "Notification",
      subtitle: "Set email notification",
      icon: FaBell,
      name: "Notification",
    },
    {
      label: "Services Status",
      subtitle: "Available and unavailable services",
      icon: FaCheckCircle,
      name: "Services",
    },
  ];

  return (
    <div className={`flex flex-col gap-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} w-full md:w-auto`}>
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`border border-solid rounded-md cursor-pointer transition-colors duration-200 ${
            activeTab === tab.name
              ? "border-blue-600 text-gray-600"
              : isDarkMode 
              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
              : "border-gray-300 text-gray-600 hover:bg-gray-100"
          } flex items-center space-x-4 px-4 py-4`}
          onClick={() => setActiveTab(tab.name)}
        >
          <tab.icon
            className={`w-6 h-6 ${activeTab === tab.name ? "text-blue-500" : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          />
          <div className="flex flex-col gap-1">
            <span className="dark:text-white">{tab.label}</span>
            <small className="dark:text-white">{tab.subtitle}</small>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;