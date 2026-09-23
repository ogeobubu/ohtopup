import React, { useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { FiBell, FiUser, FiLogOut, FiMoon, FiSun, FiCheck } from "react-icons/fi";
import { getNotifications, readNotification } from "../../api";
import { toggleDarkMode } from "../../../actions/themeActions";

type NotificationItem = {
  _id: string;
  id?: string;
  title: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: string | number | Date;
};

const Header = () => {
  const user = useSelector((state: any) => state.admin?.admin);
  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode || false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = ({ users: "Users", providers: "Providers", newsletter: "Newsletter", logs: "System logs", tutorials: "Tutorials", ranking: "Ranking", dashboard: "Overview", utilities: "Payments", transactions: "Transactions", wallet: "Wallet", settings: "Settings", support: "Support", referral: "Referrals", rank: "Rewards", "bet-dice": "Games" })[location.pathname.split("/")[2]] || "Account";

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
    localStorage.removeItem("ohtopup-admin-token");
    navigate("/admin/login");
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsDropdownOpen(false);
  };

  const { data: notificationsData = [], isLoading, error, refetch } = useQuery<NotificationItem[]>({
    queryKey: ['admin-notifications', user?._id],
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
    await readNotification(notification.id || notification._id);
    refetch();
    setIsNotificationOpen(false);
  };

  const markAllAsRead = async () => {
    try {
      if (!Array.isArray(notificationsData)) return;
      const unread = notificationsData.filter((n) => !n.read);
      await Promise.all(unread.map((n) => readNotification(n.id || n._id)));
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
    <nav className="sticky top-0 z-40 min-h-[72px] border-b border-line bg-paper px-4 py-3.5 pl-16 md:px-8 md:pl-8" aria-label="Account controls">
      <div className="mx-auto flex max-w-[1280px] min-w-0 items-center justify-between gap-2 md:gap-5">
        <div className="min-w-0 text-[11px] text-muted md:text-xs">
          Admin workspace <span className="ml-3 hidden text-ink md:inline">/&nbsp; {pageTitle}</span>
        </div>
        <div className="flex items-center gap-0.5 md:gap-2">
          <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2" onClick={() => dispatch(toggleDarkMode())} aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {isDarkMode ? <FiSun className="h-[18px] w-[18px]" /> : <FiMoon className="h-[18px] w-[18px]" />}
          </button>
          <div className="relative" ref={notificationRef}>
            <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2" onClick={toggleNotification}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={isNotificationOpen} aria-controls="admin-notifications">
              <FiBell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_0_2px_var(--ot-paper)]" aria-hidden="true" />}
            </button>
            {isNotificationOpen && (
              <section id="admin-notifications" className="fixed left-4 right-4 top-[76px] z-50 max-h-[calc(100dvh-92px)] max-w-[calc(100vw-32px)] overflow-y-auto overscroll-contain border border-line bg-paper text-ink shadow-[0_8px_24px_#0000000d] md:absolute md:left-auto md:right-0 md:top-[calc(100%+12px)] md:max-h-[min(380px,60dvh)] md:w-[360px] xs:left-8 xs:right-8" aria-label="Notifications">
                <div className="flex items-center justify-between gap-3 border-b border-line p-[18px]">
                  <h2 className="flex items-center gap-2 text-[13px] font-semibold">Notifications {unreadCount > 0 && <span className="text-[11px] font-normal text-muted">{unreadCount}</span>}</h2>
                  <button className="inline-flex min-h-8 items-center justify-center gap-[5px] text-[11px] text-accent disabled:cursor-default disabled:opacity-55" onClick={markAllAsRead} disabled={unreadCount === 0}><FiCheck />Mark all read</button>
                </div>
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2.5 p-8 text-center text-xs text-muted" role="status">Loading notifications…</div>
                ) : error ? (
                  <div className="flex flex-col items-center gap-2.5 p-8 text-center text-xs text-muted" role="alert"><p>Couldn’t load notifications.</p><button className="text-[11px] text-accent" onClick={() => refetch()}>Try again</button></div>
                ) : notificationsData.length === 0 ? (
                  <div className="flex flex-col items-center gap-2.5 p-8 text-center text-xs text-muted"><FiBell className="h-[22px] w-[22px]" /><p>No notifications yet</p><small className="text-[11px]">Your latest updates will appear here.</small></div>
                ) : (
                  <ul>
                    {notificationsData.map((notification) => (
                      <li key={notification._id} className="border-t border-line first:border-t-0">
                        <button className="flex w-full items-start gap-2.5 p-[18px] text-left hover:bg-bg" onClick={() => handleNotificationClick(notification)}>
                          <span className={`mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full ${notification.read ? 'bg-transparent' : 'bg-accent'}`} aria-label={notification.read ? 'Read' : 'Unread'} />
                          <span className="flex min-w-0 flex-col gap-[5px] overflow-wrap-anywhere">
                            <strong className="text-xs font-mediumish leading-normal">{notification.title}</strong>
                            <span className="text-xs leading-relaxed text-muted">{notification.message}</span>
                            <small className="mt-0.5 text-[10px] text-muted">{timeAgo(notification.createdAt)}</small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
          <div className="relative" ref={dropdownRef}>
            <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2" onClick={toggleDropdown} aria-label="Profile options" aria-expanded={isDropdownOpen} aria-controls="admin-profile"><FiUser className="h-[18px] w-[18px]" /></button>
            {isDropdownOpen && (
              <section id="admin-profile" className="absolute right-[-4px] top-[calc(100%+12px)] z-50 w-[240px] max-w-[calc(100vw-16px)] overflow-hidden rounded-lg border border-line bg-paper text-ink shadow-[0_8px_24px_#0000000d] md:right-0 md:max-w-none" aria-label="Profile options">
                <div className="flex flex-col gap-[5px] overflow-wrap-anywhere border-b border-line p-[18px]">
                  <strong className="text-[13px] font-mediumish">{user?.username || 'Administrator'}</strong>
                  {user?.email && <span className="text-[11px] text-muted">{user.email}</span>}
                </div>
                <div className="p-1.5">
                  <button className="flex min-h-11 w-full items-center gap-3 rounded px-3 py-2.5 text-left text-xs hover:bg-bg" onClick={() => { navigate("/admin/settings"); setIsDropdownOpen(false); }}><FiUser className="text-base text-muted" />My profile</button>
                  <button className="flex min-h-11 w-full items-center gap-3 rounded px-3 py-2.5 text-left text-xs hover:bg-bg" onClick={handleLogout}><FiLogOut className="text-base text-muted" />Log out</button>
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
