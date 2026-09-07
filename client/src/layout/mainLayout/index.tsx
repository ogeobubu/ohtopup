import Header from '../header';
import Sidebar from '../sidebar';
import { Link, Outlet } from 'react-router-dom';
import OfflineIndicator from '../../components/ui/OfflineIndicator';
export default function MainLayout() {
  return <div className="ot-shell"><a className="sr-only focus:not-sr-only" href="#account-content">Skip to content</a><Sidebar />
    <div className="ot-app-content"><Header /><main className="ot-app-main" id="account-content"><Outlet /></main>
      <footer className="ot-app-footer"><span>OhTopUp · Everyday essentials</span><Link to="/support">Need a hand?</Link></footer>
    </div><OfflineIndicator />
  </div>;
}
