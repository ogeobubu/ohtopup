import type { CSSProperties } from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import { Link, Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen overflow-wrap-anywhere bg-bg text-ink" style={{ '--ot-accent': '#247366', '--ot-tint': '#edf5f2' } as CSSProperties}>
      <a className="sr-only focus:not-sr-only" href="#admin-content">Skip to content</a>
      <Sidebar />
      <div className="min-w-0 ml-0 md:ml-[224px]">
        <Header />
        <main className="mx-auto min-h-[calc(100vh-145px)] w-full max-w-admin min-w-0 p-4 md:p-8" id="admin-content"><Outlet /></main>
        <footer className="mx-4 flex flex-wrap justify-between gap-4 border-t border-line py-[22px] text-[10px] text-muted md:mx-8">
          <span>OhTopUp · Administration</span>
          <div className="flex flex-wrap gap-5">
            <Link to="/admin/settings">Settings</Link>
            <Link to="/admin/logs">System logs</Link>
            <Link to="/admin/support">Support</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
