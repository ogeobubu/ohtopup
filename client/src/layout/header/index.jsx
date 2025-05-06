import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { FaBell, FaUserCircle, FaSignOutAlt, FaMoon, FaSun, FaCircle } from "react-icons/fa";
import { clearUserData } from "../../actions/userActions";
import { getNotifications, readNotification } from "../../api";
import { toggleDarkMode } from "../../actions/themeActions";

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

  const { data: notificationsData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', user?._id],
    queryFn: () => getNotifications(user._id),
    enabled: !!user?._id,
  });

  const unreadCount = notificationsData.filter(notification => !notification.read).length;

  const handleNotificationClick = async (notification) => {
    await readNotification(notification._id);
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
    <nav className={`bg-white dark:bg-gray-800 py-2 flex flex-col md:flex-row justify-between items-center md:mt-0 mt-5`}>
      <div className="text-gray-800 dark:text-white">
        <span className="text-xl font-bold">Hello</span>, {user?.username} 👋
      </div>
      <div className="flex items-center space-x-2 mt-2 md:mt-0">
        <button
          className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
          onClick={() => dispatch(toggleDarkMode())}
          aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
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
            aria-label="Notifications"
          >
            <FaBell className="w-4 h-4 text-gray-500 dark:text-gray-300 cursor-pointer" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
  <div className="absolute z-10 left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md p-4">
    <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
    {isLoading ? (
      <p className="text-gray-500">Loading notifications...</p>
    ) : error ? (
      <p className="text-red-500">Error loading notifications.</p>
    ) : (
      <ul className="mt-2 max-h-48 overflow-y-auto">
        {notificationsData.map((notification) => (
          <li
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`flex items-start py-2 ${!notification.read ? 'bg-gray-100 dark:bg-gray-700' : ''} cursor-pointer`}
          >
            <FaCircle className={`w-2 h-2 mr-2 ${!notification.read ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="flex-1">
              <span className="font-medium">{notification.title}</span>
              <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
              <small className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleTimeString()}</small>
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
            <FaUserCircle className="text-gray-500 w-4 h-4" />
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
    </nav>
  );
};

export default Header;