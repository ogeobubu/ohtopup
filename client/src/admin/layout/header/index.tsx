import React, { useState, useRef, useEffect, useMemo } from "react";
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
  const user = useSelector((state: any) => state.admin?.admin);
  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode || false);
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
    navigate("/admin/login");
  };

  const {
    data: notificationsData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", user?._id],
    queryFn: () => getNotifications(),
    enabled: !!user?._id,
    refetchInterval: 15000,
  });

  const notifications = Array.isArray(notificationsData) ? notificationsData : [];
  const unreadCount = useMemo(() => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter((notification) => !notification.read).length;
  }, [notifications]);

  const timeAgo = (dateInput) => {
    const date = new Date(dateInput);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const intervals: [number, Intl.RelativeTimeFormatUnit][] = [
      [60, 'second'],
      [60, 'minute'],
      [24, 'hour'],
      [7, 'day'],
      [4.345, 'week'],
      [12, 'month'],
      [Number.POSITIVE_INFINITY, 'year'],
    ];
    let unit: Intl.RelativeTimeFormatUnit = 'second';
    let value = seconds;
    for (const [limit, nextUnit] of intervals) {
      if (value < limit) {
        unit = nextUnit;
        break;
      }
      value = Math.floor(value / limit);
    }
    return rtf.format(-value, unit);
  };

  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notification) => {
    await readNotification(notification.id);
    refetch();
    setIsNotificationOpen(false);
  };

  const markAllAsRead = async () => {
    try {
      if (!Array.isArray(notifications)) return;
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => readNotification(n.id)));
      refetch();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 py-2 flex flex-col md:flex-row md:justify-between justify-center items-center md:mt-0 mt-5 px-4">
      <div className="text-gray-800 dark:text-white text-lg md:text-xl font-bold">
        Hello, <span className="text-sm">{user?.username} 👋</span>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <button
          className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full transition-colors duration-200"
          onClick={() => dispatch(toggleDarkMode())}
        >
          {isDarkMode ? (
            <FaSun className="w-4 h-4 text-yellow-500" />
          ) : (
            <FaMoon className="w-4 h-4 text-gray-500 dark:text-gray-800" />
          )}
        </button>
        <div className="relative" ref={notificationRef}>
          <button
            className="bg-gray-100 p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={toggleNotification}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={isNotificationOpen}
            aria-haspopup="menu"
          >
            <FaBell className="w-4 h-4 text-gray-500 dark:text-gray-800 cursor-pointer" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div
              className="absolute z-10 right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 shadow-lg rounded-md p-3 max-h-96 overflow-hidden"
              role="menu"
              aria-label="Notifications menu"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Notifications</h3>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:underline disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  disabled={unreadCount === 0}
                  aria-label="Mark all notifications as read"
                >
                  Mark all as read
                </button>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-10 bg-gray-100 dark:bg-gray-700 rounded" />
                  ))}
                </div>
              ) : error ? (
                <p className="text-red-500 text-sm">Error loading notifications.</p>
              ) : notifications.length === 0 ? (
                <div className="text-sm text-gray-500">No notifications yet.</div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700" role="none">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start py-2 px-1 rounded ${!notification.read ? 'bg-blue-50 dark:bg-gray-700/40' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      role="menuitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotificationClick(notification);
                        }
                      }}
                    >
                      <FaCircle className={`mt-1.5 w-1.5 h-1.5 mr-2 flex-shrink-0 ${!notification.read ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-gray-900 dark:text-white truncate" title={notification.title}>
                            {notification.title}
                          </span>
                          <small className="text-xs text-gray-500 ml-2 flex-shrink-0">{timeAgo(notification.createdAt)}</small>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5" title={notification.message}>
                          {notification.message}
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
            className="bg-gray-100 p-2 rounded-full text-gray-700 hover:bg-gray-300 transition-colors duration-200"
            onClick={toggleDropdown}
          >
            <FaUserCircle className="text-gray-500 dark:text-gray-800 w-4 h-4" />
          </button>

          {isDropdownOpen && (
            <div className="dark:bg-gray-900 absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md p-2 z-10">
              <ul>
                <li className="py-2 px-4 hover:bg-gray-100 flex items-center cursor-pointer">
                  <FaUserCircle className="text-blue-500 w-5 h-5 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-[18px]">Profile</span>
                    <small className="text-[14px] text-gray-400">
                      View my profile
                    </small>
                  </div>
                </li>
                <li
                  className="py-2 px-4 hover:bg-gray-100 flex items-center cursor-pointer"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="text-blue-500 w-5 h-5 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-[18px]">Logout</span>
                    <small className="text-[14px] text-gray-400">
                      Logout of your account
                    </small>
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