import React from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const MainLayout = () => {
  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode || false);

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
      }`}
    >
      <Sidebar />
      <div className="md:ml-56 ml-0 transition-all duration-300">
        <div className="sticky top-0 z-40">
          <Header />
        </div>
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
        <footer
          className={`text-center py-8 mt-12 border-t ${
            isDarkMode
              ? "border-gray-700 text-gray-400 bg-gray-900"
              : "border-gray-200 text-gray-500 bg-white"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm">
              © 2024 OhTopUp Inc. Admin Panel. All rights reserved.
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-xs">
              <a href="/admin/settings" className="hover:text-green-600 transition-colors">
                Admin Settings
              </a>
              <a href="/admin/support" className="hover:text-green-600 transition-colors">
                Support
              </a>
              <a href="/admin/logs" className="hover:text-green-600 transition-colors">
                System Logs
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
