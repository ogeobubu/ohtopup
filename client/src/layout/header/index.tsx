import React, { useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { FiBell, FiUser, FiLogOut, FiMoon, FiSun, FiCheck } from "react-icons/fi";
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
  const user = useSelector((state: any) => state.user?.user);
  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode || false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = ({ dashboard: "Overview", utilities: "Payments", transactions: "Transactions", wallet: "Wallet", settings: "Settings", support: "Support", referral: "Referrals", rank: "Rewards", "bet-dice": "Games" })[location.pathname.split("/")[1]] || "Account";

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("ohtopup-token");
    localStorage.removeItem("ohtopup-refresh-token");
    dispatch(clearUserData());
    navigate("/login");
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsDropdownOpen(false);
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
    if (Number.isNaN(date.getTime())) return "";
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
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
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
    <nav className="ot-app-header" aria-label="Account controls">
      <div className="ot-header-inner">
        <div className="ot-header-title">Your account <span>/ &nbsp; {pageTitle}</span></div>
        <div className="ot-account-controls">
          <button className="ot-icon-button" onClick={() => dispatch(toggleDarkMode())} aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {isDarkMode ? <FiSun /> : <FiMoon />}
          </button>
          <div className="ot-dropdown-anchor" ref={notificationRef}>
            <button className="ot-icon-button" onClick={toggleNotification}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={isNotificationOpen} aria-controls="account-notifications">
              <FiBell />
              {unreadCount > 0 && <span className="ot-unread-dot" aria-hidden="true" />}
            </button>
            {isNotificationOpen && (
              <section id="account-notifications" className="ot-dropdown ot-notifications" aria-label="Notifications">
                <div className="ot-dropdown-heading">
                  <h2>Notifications {unreadCount > 0 && <span>{unreadCount}</span>}</h2>
                  <button className="ot-dropdown-text-button" onClick={markAllAsRead} disabled={unreadCount === 0}><FiCheck />Mark all read</button>
                </div>
                {isLoading ? (
                  <div className="ot-dropdown-empty" role="status">Loading notifications…</div>
                ) : error ? (
                  <div className="ot-dropdown-empty" role="alert"><p>Couldn’t load notifications.</p><button className="ot-dropdown-text-button" onClick={() => refetch()}>Try again</button></div>
                ) : notificationsData.length === 0 ? (
                  <div className="ot-dropdown-empty"><FiBell /><p>No notifications yet</p><small>Your latest updates will appear here.</small></div>
                ) : (
                  <ul className="ot-notification-list">
                    {notificationsData.map((notification) => (
                      <li key={notification._id}>
                        <button className="ot-notification-item" onClick={() => handleNotificationClick(notification)}>
                          <span className={`ot-notification-dot${notification.read ? '' : ' is-unread'}`} aria-label={notification.read ? 'Read' : 'Unread'} />
                          <span className="ot-notification-copy"><strong>{notification.title}</strong><span>{notification.message}</span><small>{timeAgo(notification.createdAt)}</small></span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
          <div className="ot-dropdown-anchor" ref={dropdownRef}>
            <button className="ot-icon-button" onClick={toggleDropdown} aria-label="Profile options" aria-expanded={isDropdownOpen} aria-controls="account-profile"><FiUser /></button>
            {isDropdownOpen && (
              <section id="account-profile" className="ot-dropdown ot-profile-dropdown" aria-label="Profile options">
                <div className="ot-profile-summary"><strong>{user?.username || 'Your account'}</strong>{user?.email && <span>{user.email}</span>}</div>
                <div className="ot-dropdown-actions">
                  <button onClick={() => { navigate("/settings"); setIsDropdownOpen(false); }}><FiUser />My profile</button>
                  <button onClick={handleLogout}><FiLogOut />Log out</button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
