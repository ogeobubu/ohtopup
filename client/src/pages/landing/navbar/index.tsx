import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiMoon, FiSun } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from '../../../actions/themeActions';
import Brand from '../../../components/ui/Brand';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const dark = useSelector((state: any) => state.theme.isDarkMode);
  const dispatch = useDispatch();
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1051px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  return (
    <header className="relative z-45 border-b border-line bg-paper text-ink">
      <div className="mx-auto box-border w-full max-w-app px-4 nav:px-10">
        <div className="flex min-h-[72px] nav:min-h-[76px] flex-wrap items-center justify-between gap-3 py-2.5">
          <Brand />
          <nav className="hidden text-[13px] font-medium nav:flex nav:items-center nav:gap-7" aria-label="Main navigation">
            <Link className="hover:text-accent" to="/pricing">Data pricing</Link>
            <Link className="hover:text-accent" to="/about">About us</Link>
            <Link className="hover:text-accent" to="/tutorials">Help centre</Link>
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 nav:gap-[18px]">
            <button
              className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink"
              onClick={() => dispatch(toggleDarkMode())}
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
            >
              <FiMoon className="h-[18px] w-[18px] dark:hidden" style={{ display: dark ? 'none' : undefined }} />
              <FiSun className="h-[18px] w-[18px]" style={{ display: dark ? undefined : 'none' }} />
            </button>
            <Link className="inline-flex items-center px-2.5 py-2.5 text-xs nav:hidden xs:inline-flex" to="/login">Log in</Link>
            <Link
              className="hidden nav:inline-flex min-h-[46px] items-center justify-center gap-4 rounded-md border border-transparent bg-accent px-[19px] py-[11px] text-sm font-semibold text-white transition-[background,border-color] hover:bg-accent-dark"
              to="/create"
            >
              Create account
            </Link>
            <button
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink nav:hidden"
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              aria-expanded={open}
              aria-controls="public-menu"
              onClick={() => setOpen(!open)}
            >
              {open ? <FiX className="h-[18px] w-[18px]" /> : <FiMenu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <nav
          id="public-menu"
          className="relative z-46 flex flex-col gap-1 border-t border-line bg-paper px-4 pb-5 pt-3 nav:hidden"
          aria-label="Mobile navigation"
        >
          <Link className="flex min-h-11 items-center py-3 text-sm" to="/pricing">Data pricing</Link>
          <Link className="flex min-h-11 items-center py-3 text-sm" to="/about">About us</Link>
          <Link className="flex min-h-11 items-center py-3 text-sm" to="/tutorials">Help centre</Link>
          <Link className="flex min-h-11 items-center py-3 text-sm" to="/login">Log in</Link>
          <Link className="flex min-h-11 items-center py-3 text-sm" to="/create">Create account</Link>
        </nav>
      )}
    </header>
  );
}
