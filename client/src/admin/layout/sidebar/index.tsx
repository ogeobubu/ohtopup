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
  return <>
    <button ref={toggle} className="ot-admin-menu-toggle ot-icon-button" aria-label="Open admin navigation" aria-expanded={isOpen} aria-controls="admin-navigation" onClick={() => setIsOpen(true)}><FiMenu /></button>
    {isOpen && <button className="ot-admin-overlay" aria-label="Close admin navigation" onClick={() => setIsOpen(false)} />}
    <aside ref={panel} id="admin-navigation" className={`ot-admin-sidebar${isOpen ? ' is-open' : ''}`}>
      <div className="ot-admin-brand"><NavLink to="/admin/dashboard" onClick={() => setIsOpen(false)}>ohtopup<span>ADMIN</span></NavLink><button className="ot-admin-menu-close" aria-label="Close admin navigation" onClick={() => setIsOpen(false)}><FiX /></button></div>
      <nav aria-label="Admin navigation">{groups.map(group => <div className="ot-admin-nav-group" key={group.label}><h2>{group.label}</h2>{group.links.map(([label, route, Icon]) => <NavLink key={route} to={`/admin/${route}`} onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon /><span>{label}</span></NavLink>)}</div>)}</nav>
      <div className="ot-admin-sidebar-footer">Operations workspace</div>
    </aside>
  </>;
}
