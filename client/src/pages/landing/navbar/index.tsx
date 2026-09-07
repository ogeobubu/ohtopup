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
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  return <header className="ot-public-header">
    <div className="ot-container ot-public-nav">
      <Brand />
      <nav className="ot-desktop-links" aria-label="Main navigation">
        <Link to="/pricing">Data pricing</Link><Link to="/about">About us</Link><Link to="/tutorials">Help centre</Link>
      </nav>
      <div className="ot-nav-actions">
        <button className="ot-icon-button" onClick={() => dispatch(toggleDarkMode())} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? <FiSun /> : <FiMoon />}</button>
        <Link className="ot-login-link" to="/login">Log in</Link>
        <Link className="ot-button ot-button-primary ot-nav-cta" to="/create">Create account</Link>
        <button className="ot-icon-button ot-mobile-only" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="public-menu" onClick={() => setOpen(!open)}>{open ? <FiX /> : <FiMenu />}</button>
      </div>
    </div>
    {open && <nav id="public-menu" className="ot-mobile-menu" aria-label="Mobile navigation">
      <Link to="/pricing">Data pricing</Link><Link to="/about">About us</Link><Link to="/tutorials">Help centre</Link><Link to="/login">Log in</Link><Link to="/create">Create account</Link>
    </nav>}
  </header>;
}
