import Header from '../header';
import Sidebar from '../sidebar';
import { Link, Outlet } from 'react-router-dom';
import OfflineIndicator from '../../components/ui/OfflineIndicator';

export default function MainLayout() {
  return (
    <div className="relative min-w-0 overflow-wrap-anywhere bg-bg text-ink">
      <a className="sr-only focus:not-sr-only" href="#account-content">Skip to content</a>
      <Sidebar />
      <div className="ml-0 min-h-dvh min-w-0 overflow-x-hidden md:ml-sidebar">
        <Header />
        <main
          className="mx-auto box-border min-h-[calc(100vh-150px)] w-full max-w-app min-w-0 px-4 py-6 md:px-6 md:py-8 xl:px-12 xl:py-[42px]"
          id="account-content"
        >
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-app min-w-0 px-4 md:px-6 xl:px-12">
          <div className="flex flex-wrap justify-between gap-4 border-t border-line py-6 text-[11px] text-muted [padding-bottom:max(24px,env(safe-area-inset-bottom))]">
            <span>OhTopUp · Everyday essentials</span>
            <Link className="hover:text-accent" to="/support">Need a hand?</Link>
          </div>
        </footer>
      </div>
      <OfflineIndicator />
    </div>
  );
}
