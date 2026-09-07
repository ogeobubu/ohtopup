import "../../styles/management.css";
import Header from "../header";
import Sidebar from "../sidebar";
import { Link, Outlet } from "react-router-dom";

export default function MainLayout() {
  return <div className="ot-admin">
    <a className="sr-only focus:not-sr-only" href="#admin-content">Skip to content</a>
    <Sidebar />
    <div className="ot-admin-content">
      <Header />
      <main className="ot-admin-main" id="admin-content"><Outlet /></main>
      <footer className="ot-admin-footer"><span>OhTopUp · Administration</span><div><Link to="/admin/settings">Settings</Link><Link to="/admin/logs">System logs</Link><Link to="/admin/support">Support</Link></div></footer>
    </div>
  </div>;
}
