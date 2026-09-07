import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiGrid, FiCreditCard, FiClock, FiWifi, FiUsers, FiAward, FiSettings, FiHelpCircle, FiMenu, FiX, FiHexagon } from 'react-icons/fi';
import Brand from '../../components/ui/Brand';
const primary = [ ['/dashboard', 'Overview', FiGrid], ['/utilities', 'Make a payment', FiWifi], ['/wallet', 'Wallet', FiCreditCard], ['/transactions', 'Transactions', FiClock] ] as const;
const secondary = [ ['/referral', 'Referrals', FiUsers], ['/rank', 'Rewards & ranking', FiAward], ['/bet-dice', 'Games', FiHexagon] ] as const;
export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const panel = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('a')?.focus();
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (e.key === 'Tab') {
        const items = [...(panel.current?.querySelectorAll<HTMLElement>('a,button') || [])];
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1)?.focus(); }
        else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keyboard); };
  }, [open]);
  const links = (items: typeof primary | typeof secondary) => items.map(([to, label, Icon]) => <NavLink key={to} to={to} className="ot-side-link"><Icon /><span>{label}</span></NavLink>);
  return <>
    <button ref={toggle} className="ot-icon-button ot-mobile-only ot-sidebar-toggle" onClick={() => setOpen(true)} aria-label="Open account navigation" aria-expanded={open} aria-controls="account-navigation"><FiMenu /></button>
    {open && <div className="ot-sidebar-overlay" onClick={() => { setOpen(false); toggle.current?.focus(); }} />}
    <aside id="account-navigation" ref={panel} className={`ot-sidebar${open ? ' is-open' : ''}`} aria-label="Account navigation">
      <div className="ot-sidebar-brand"><Brand to="/dashboard" /><button className="ot-icon-button ot-mobile-only" onClick={() => { setOpen(false); toggle.current?.focus(); }} aria-label="Close account navigation"><FiX /></button></div>
      <p className="ot-sidebar-label">YOUR ACCOUNT</p><nav aria-label="Payments">{links(primary)}</nav>
      <div className="ot-sidebar-secondary"><p className="ot-sidebar-label">MORE FROM OHTOPUP</p><nav aria-label="More">{links(secondary)}</nav></div>
      <div className="ot-sidebar-bottom"><nav aria-label="Account settings"><NavLink className="ot-side-link" to="/settings"><FiSettings />Settings</NavLink><NavLink className="ot-side-link" to="/support"><FiHelpCircle />Help & support</NavLink></nav><small>© {new Date().getFullYear()} OhTopUp</small></div>
    </aside>
  </>;
}
