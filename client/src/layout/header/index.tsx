import React, { useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { FaBell, FaUserCircle, FaSignOutAlt, FaMoon, FaSun, FaCircle } from "react-icons/fa";
import { clearUserData } from "../../actions/userActions";
import { getNotifications, readNotification } from "../../api";
import { toggleDarkMode } from "../../actions/themeActions";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: string | number | Date;
};

const Header = () => {
  const user = useSelector(state => state.user.user);
  const isDarkMode = useSelector(state => state.theme.isDarkMode);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  
  const notificationRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("ohtopup-token");
    dispatch(clearUserData());
    navigate("/login");
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const { data: notificationsData = [], isLoading, error, refetch } = useQuery<NotificationItem[]>({
    queryKey: ['notifications', user?._id],
    queryFn: () => getNotifications(),
    enabled: !!user?._id,
    refetchInterval: 15000,
  });

  const unreadCount = useMemo(() => {
    if (!Array.isArray(notificationsData)) return 0;
    return notificationsData.filter((n) => !n.read).length;
  }, [notificationsData]);

  const timeAgo = (dateInput: string | number | Date) => {
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
    let acc = 1;
    for (const [limit, nextUnit] of intervals) {
      if (value < limit) {
        unit = nextUnit;
        break;
      }
      value = Math.floor(value / limit);
    }
    return rtf.format(-value, unit);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    await readNotification(notification._id);
    refetch();
    navigate(`${notification.link}`);
    setIsNotificationOpen(false);
  };

  const markAllAsRead = async () => {
    try {
      if (!Array.isArray(notificationsData)) return;
      const unread = notificationsData.filter((n) => !n.read);
      await Promise.all(unread.map((n) => readNotification(n._id)));
      refetch();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
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
    <nav className={`bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className={`text-gray-800 dark:text-white mb-2 md:mb-0`}>
          <span className="text-lg md:text-xl font-bold">Hello</span>, {user?.username} 👋
        </div>
        <div className="flex items-center space-x-3">
        <button
          className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
          onClick={() => dispatch(toggleDarkMode())}
          aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <FaSun className="w-4 h-4 text-yellow-500" />
          ) : (
            <FaMoon className="w-4 h-4 text-gray-500 dark:text-gray-800" />
          )}
        </button>
        <div className="relative" ref={notificationRef}>
          <button
            className="bg-gray-100 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              ) : notificationsData.length === 0 ? (
                <div className="text-sm text-gray-500">No notifications yet.</div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700" role="none">
                  {notificationsData.map((notification) => (
                    <li
                      key={notification._id}
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

        <div className="relative inline-block" ref={dropdownRef}>
          <button
            className="bg-gray-100 p-2 rounded-full text-gray-700 hover:bg-gray-300"
            onClick={toggleDropdown}
            aria-label="User Menu"
          >
            <FaUserCircle className="text-gray-500 dark:text-gray-800 w-4 h-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-md rounded-md p-2">
              <ul>
                <li 
                  onClick={() => {
                    navigate("/settings");
                    setIsDropdownOpen(false);
                  }} 
                  className="cursor-pointer py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <FaUserCircle className="text-blue-500 w-5 h-5 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-[18px] dark:text-white">Profile</span>
                    <small className="text-[14px] text-gray-400 dark:text-gray-300">View my profile</small>
                  </div>
                </li>
                <li 
                  className="py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center cursor-pointer"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="text-blue-500 w-5 h-5 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-[18px] dark:text-white">Logout</span>
                    <small className="text-[14px] text-gray-400 dark:text-gray-300">Logout of your account</small>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      </div>
    </nav>
  );
};

export default Header;