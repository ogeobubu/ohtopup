import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiGrid, FiCreditCard, FiClock, FiWifi, FiUsers, FiAward, FiSettings, FiHelpCircle, FiMenu, FiX, FiHexagon } from 'react-icons/fi';
import Brand from '../../components/ui/Brand';

const primary = [ ['/dashboard', 'Overview', FiGrid], ['/utilities', 'Make a payment', FiWifi], ['/wallet', 'Wallet', FiCreditCard], ['/transactions', 'Transactions', FiClock] ] as const;
const secondary = [ ['/referral', 'Referrals', FiUsers], ['/rank', 'Rewards & ranking', FiAward], ['/bet-dice', 'Games', FiHexagon] ] as const;

const sideLink = "flex min-h-[46px] items-center gap-3 rounded-[5px] border border-transparent px-4 py-[11px] text-[13px] text-muted no-underline hover:bg-bg hover:text-ink aria-[current=page]:bg-tint aria-[current=page]:font-semibold aria-[current=page]:text-accent";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const panel = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
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
  const links = (items: typeof primary | typeof secondary) =>
    items.map(([to, label, Icon]) => (
      <NavLink key={to} to={to} className={sideLink}>
        <Icon className="h-[17px] w-[17px] shrink-0 stroke-[1.65]" />
        <span>{label}</span>
      </NavLink>
    ));
  return (
    <>
      <button
        ref={toggle}
        className="absolute left-3 top-4 z-43 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-paper text-muted hover:bg-tint hover:text-ink md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open account navigation"
        aria-expanded={open}
        aria-controls="account-navigation"
      >
        <FiMenu className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-44 bg-[#101c2b70]"
          onClick={() => { setOpen(false); toggle.current?.focus(); }}
        />
      )}
      <aside
        id="account-navigation"
        ref={panel}
        aria-label="Account navigation"
        className={[
          'fixed bottom-0 left-0 top-0 z-45 flex w-[min(300px,calc(100vw-32px))] flex-col overflow-y-auto border-r border-line bg-paper px-[18px] pb-[max(22px,env(safe-area-inset-bottom))] pt-[30px] transition-transform duration-200 overscroll-y-contain md:w-sidebar',
          open ? 'translate-x-0 visible' : '-translate-x-full invisible md:translate-x-0 md:visible',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-2 pb-10 md:px-4">
          <Brand to="/dashboard" />
          <button
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-bg hover:text-ink md:hidden"
            onClick={() => { setOpen(false); toggle.current?.focus(); }}
            aria-label="Close account navigation"
          >
            <FiX className="h-[18px] w-[18px]" />
          </button>
        </div>
        <p className="mb-3 px-4 text-[10px] font-semibold tracking-[1.4px] text-muted">YOUR ACCOUNT</p>
        <nav aria-label="Payments" className="flex flex-col gap-1">{links(primary)}</nav>
        <div className="mt-[30px]">
          <p className="mb-3 px-4 text-[10px] font-semibold tracking-[1.4px] text-muted">MORE FROM OHTOPUP</p>
          <nav aria-label="More" className="flex flex-col gap-1">{links(secondary)}</nav>
        </div>
        <div className="mt-auto pt-[30px]">
          <nav aria-label="Account settings" className="flex flex-col gap-1">
            <NavLink className={sideLink} to="/settings"><FiSettings className="h-[17px] w-[17px] shrink-0 stroke-[1.65]" />Settings</NavLink>
            <NavLink className={sideLink} to="/support"><FiHelpCircle className="h-[17px] w-[17px] shrink-0 stroke-[1.65]" />Help &amp; support</NavLink>
          </nav>
          <small className="mx-4 mt-5 block text-[10px] text-muted">© {new Date().getFullYear()} OhTopUp</small>
        </div>
      </aside>
    </>
  );
}
