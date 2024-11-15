import React, { useState } from "react";
import { useSelector } from "react-redux"
import {
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaMoon,
  FaSun,
} from "react-icons/fa";

const Header = () => {
  const user = useSelector(state => state.user.user)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 py-2 flex justify-between items-center">
      <div className="text-gray-800 dark:text-white"><span className="text-xl font-bold">Hello</span>, {user?.username} 👋</div>
      <div className="flex items-center space-x-2">
        <button
          className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? (
            <FaSun className="w-4 h-4 text-yellow-500" />
          ) : (
            <FaMoon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
          )}
        </button>
        <div className="bg-gray-100 p-2 rounded-full">
          <FaBell className="w-4 h-4 text-gray-500 dark:text-gray-300 cursor-pointer" />
        </div>

        <div className="relative inline-block">
          <button
            className="bg-gray-100 p-2 rounded-full text-gray-700 hover:bg-gray-300"
            onClick={toggleDropdown}
          >
            <FaUserCircle className="text-gray-500 w-4 h-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md p-2">
              <ul>
                <li className="py-2 px-4 hover:bg-gray-100 flex items-center">
                  <FaUserCircle className="text-blue-500 w-5 h-5 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-[18px]">Profile</span>
                    <small className="text-[14px] text-gray-400">View my profile</small>
                  </div>
                  
                </li>
                <li className="py-2 px-4 hover:bg-gray-100 flex items-center">
                  <FaSignOutAlt className="text-blue-500 w-5 h-5 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-[18px]">Logout</span>
                    <small className="text-[14px] text-gray-400">Logout of your account</small>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
