import React from "react";
import { useSelector } from "react-redux";
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
      label: "Profile",
      subtitle: "View and edit your profile",
      icon: FaUserCircle,
      name: "Profile",
      color: "blue",
    },
    {
      label: "General",
      subtitle: "General settings and themes",
      icon: FaCog,
      name: "General",
      color: "purple",
    },
    {
      label: "Security",
      subtitle: "Update PIN and Password",
      icon: FaShieldAlt,
      name: "Security",
      color: "green",
    },
    {
      label: "Notification",
      subtitle: "Set email notification",
      icon: FaBell,
      name: "Notification",
      color: "orange",
    },
    {
      label: "Services",
      subtitle: "Available and unavailable services",
      icon: FaCheckCircle,
      name: "Services",
      color: "indigo",
    },
  ];

  const getTabStyles = (tabName, isActive) => {
    const colorMap = {
      blue: isActive
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
        : `${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700`,
      purple: isActive
        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
        : `${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700`,
      green: isActive
        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
        : `${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700`,
      orange: isActive
        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
        : `${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700`,
      indigo: isActive
        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg"
        : `${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700`,
    };

    return colorMap[tabs.find(tab => tab.name === tabName)?.color] || colorMap.blue;
  };

  return (
    <div className="w-full">
      {/* Mobile: Horizontal scrollable tabs */}
      <div className="md:hidden overflow-x-auto pb-2">
        <div className="flex space-x-2 min-w-max px-2">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.name
                  ? getTabStyles(tab.name, true)
                  : getTabStyles(tab.name, false)
              } border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              onClick={() => setActiveTab(tab.name)}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Full width horizontal tabs */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 gap-4">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                activeTab === tab.name
                  ? getTabStyles(tab.name, true)
                  : getTabStyles(tab.name, false)
              } border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              onClick={() => setActiveTab(tab.name)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full ${
                  activeTab === tab.name
                    ? "bg-white/20"
                    : `${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} group-hover:bg-gray-200 dark:group-hover:bg-gray-600`
                } transition-colors duration-200`}>
                  <tab.icon className={`w-6 h-6 ${
                    activeTab === tab.name
                      ? "text-white"
                      : `${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`
                  }`} />
                </div>

                <div>
                  <h3 className={`font-semibold text-sm ${
                    activeTab === tab.name
                      ? "text-white"
                      : `${isDarkMode ? 'text-white' : 'text-gray-900'}`
                  }`}>
                    {tab.label}
                  </h3>
                  <p className={`text-xs mt-1 ${
                    activeTab === tab.name
                      ? "text-blue-100"
                      : `${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`
                  }`}>
                    {tab.subtitle}
                  </p>
                </div>

                {/* Active indicator */}
                {activeTab === tab.name && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active tab indicator for mobile */}
      <div className="md:hidden mt-4 flex justify-center">
        <div className="flex space-x-1">
          {tabs.map((tab, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                activeTab === tab.name
                  ? "bg-blue-600"
                  : `${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;