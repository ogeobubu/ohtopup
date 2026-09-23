import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiGrid, FiCreditCard, FiBriefcase, FiUsers, FiUserPlus, FiAward, FiTarget, FiServer, FiBookOpen, FiMail, FiFileText, FiSettings, FiHelpCircle, FiMenu, FiX } from "react-icons/fi";

const groups = [
  { label: 'Workspace', links: [
    ['Overview', 'dashboard', FiGrid], ['Transactions', 'transactions', FiCreditCard], ['Wallet', 'wallet', FiBriefcase], ['Users', 'users', FiUsers],
  ] },
  { label: 'Manage', links: [
    ['Referrals', 'referral', FiUserPlus], ['Ranking', 'ranking', FiAward], ['Bet Dice Game', 'bet-dice', FiTarget], ['Providers', 'providers', FiServer], ['Tutorials', 'tutorials', FiBookOpen], ['Newsletter', 'newsletter', FiMail],
  ] },
  { label: 'Administration', links: [
    ['System logs', 'logs', FiFileText], ['Settings', 'settings', FiSettings], ['Help & support', 'support', FiHelpCircle],
  ] },
] as const;

const navLink = "m-0.5 flex min-h-11 items-center gap-[11px] rounded px-3 py-[9px] text-xs text-inherit no-underline border-l-2 border-transparent hover:bg-admin-hover hover:text-white";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (desktop.matches) setIsOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('a')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsOpen(false); toggle.current?.focus(); }
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('a,button') || []);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keyboard); };
  }, [isOpen]);
  return (
    <>
      <button
        ref={toggle}
        className={[
        'fixed left-3 top-4 z-41 min-h-11 min-w-11 items-center justify-center rounded-md bg-paper text-muted hover:bg-tint hover:text-ink md:hidden',
        isOpen ? 'hidden' : 'inline-flex',
      ].join(' ')}
      aria-label="Open admin navigation"
        aria-expanded={isOpen}
        aria-controls="admin-navigation"
        onClick={() => setIsOpen(true)}
      >
        <FiMenu className="h-[18px] w-[18px]" />
      </button>
      {isOpen && (
        <button
          className="fixed inset-0 z-45 bg-[#101c2b70] md:hidden"
          aria-label="Close admin navigation"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        ref={panel}
        id="admin-navigation"
        className={[
          'fixed inset-y-0 left-0 z-46 flex w-60 flex-col overflow-y-auto bg-admin-chrome px-3.5 pb-[max(18px,env(safe-area-inset-bottom))] pt-[26px] text-admin-text overscroll-y-contain transition-transform duration-200',
          isOpen ? 'translate-x-0 visible' : '-translate-x-full invisible md:translate-x-0 md:visible',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-3 pb-[26px]">
          <NavLink to="/admin/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5 text-[23px] font-semibold tracking-[-1px] text-[#f2f6f7] no-underline">
            ohtopup
            <span className="rounded-[3px] border border-admin-ring px-[5px] py-1 text-[8px] font-medium tracking-[1.2px] text-[#b3c9c4]">ADMIN</span>
          </NavLink>
          <button
            className="block min-h-11 min-w-11 p-2 text-admin-text"
            aria-label="Close admin navigation"
            onClick={() => setIsOpen(false)}
          >
            <FiX />
          </button>
        </div>
        <nav aria-label="Admin navigation">
          {groups.map(group => (
            <div className="mb-5" key={group.label}>
              <h2 className="mb-2 px-3 text-[9px] font-medium uppercase tracking-[1.2px] text-admin-muted">{group.label}</h2>
              {group.links.map(([label, route, Icon]) => (
                <NavLink
                  key={route}
                  to={`/admin/${route}`}
                  onClick={() => setIsOpen(false)}
                  className={navLink}
                  data-active={undefined}
                  style={({ isActive }) => isActive ? { background: '#2d423f', borderLeftColor: '#90c8b9', color: '#e3f3ed' } : undefined}
                >
                  <Icon className="shrink-0 text-base" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="mt-auto border-t border-admin-border px-3 pt-[18px] text-[10px] text-admin-muted">
          Operations workspace
        </div>
      </aside>
    </>
  );
}
