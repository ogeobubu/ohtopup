import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaCircle,
} from "react-icons/fa";
import { getNotifications, readNotification } from "../../api";
import { toggleDarkMode } from "../../../actions/themeActions";

const Header = () => {
  const user = useSelector((state) => state.admin.admin);
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const notificationRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("ohtopup-admin-token");
    navigate("/admin");
  };

  const {
    data: notificationsData = { notifications: [] },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", user?._id],
    queryFn: () => getNotifications(user._id),
    enabled: !!user?._id,
  });

  const notifications = notificationsData.notifications || [];
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notification) => {
    await readNotification(notification.id);
    refetch();
    navigate(`${notification.link}`);
    setIsNotificationOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-800 py-2 flex flex-wrap justify-between items-center md:mt-0 mt-5 px-4">
      <div className="text-gray-800 dark:text-white text-lg md:text-xl font-bold">
        Hello, {user?.username} 👋
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <button
          className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
          onClick={() => dispatch(toggleDarkMode())}
        >
          {isDarkMode ? (
            <FaSun className="w-4 h-4 text-yellow-500" />
          ) : (
            <FaMoon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
          )}
        </button>
        <div className="relative" ref={notificationRef}>
          <button
            className="bg-gray-100 p-2 rounded-full"
            onClick={toggleNotification}
          >
            <FaBell className="w-4 h-4 text-gray-500 dark:text-gray-300 cursor-pointer" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute z-10 right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
              {isLoading ? (
                <p className="text-gray-500">Loading notifications...</p>
              ) : error ? (
                <p className="text-red-500">Error loading notifications.</p>
              ) : (
                <ul className="mt-2 max-h-48 overflow-y-auto">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start py-2 ${!notification.read ? "bg-gray-100 dark:bg-gray-700" : ""} cursor-pointer`}
                    >
                      <FaCircle className={`w-2 h-2 mr-2 ${!notification.read ? "text-blue-500" : "text-gray-400"}`} />
                      <div className="flex-1">
                        <span className="font-medium">{notification.message}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div ref={dropdownRef}>
          <button
            className="bg-gray-100 p-2 rounded-full text-gray-700 hover:bg-gray-300"
            onClick={toggleDropdown}
          >
            <FaUserCircle className="text-gray-500 w-4 h-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md p-2 z-10">
              <ul>
                <li className="py-2 px-4 hover:bg-gray-100 flex items-center">
                  <FaUserCircle className="text-blue-500 w-5 h-5 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-[18px]">Profile</span>
                    <small className="text-[14px] text-gray-400">View my profile</small>
                  </div>
                </li>
                <li
                  className="py-2 px-4 hover:bg-gray-100 flex items-center cursor-pointer"
                  onClick={handleLogout}
                >
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