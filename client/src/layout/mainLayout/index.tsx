import React from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const MainLayout = () => {
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

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
        <main className="flex-1 py-4 px-2 sm:px-4 lg:px-6 max-w-4xl mx-auto">
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
              © 2024 OhTopUp Inc. All rights reserved.
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-xs">
              <a href="/privacy" className="hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-blue-600 transition-colors">
                Terms of Service
              </a>
              <a href="/support" className="hover:text-blue-600 transition-colors">
                Support
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
