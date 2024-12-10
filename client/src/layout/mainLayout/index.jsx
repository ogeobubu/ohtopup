import React from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const MainLayout = () => {
  const isDarkMode = useSelector(state => state.theme.isDarkMode);

  return (
    <div className={`flex ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      <Sidebar className={`w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
      <div className="flex-1 md:ml-48 ml-0 py-4 px-8 md:px-16">
        <div className="mb-5">
          <Header />
        </div>
        <Outlet />
        <p className={`text-center my-8 py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Copyright 2024, OhTopUp Inc.
        </p>
      </div>
    </div>
  );
};

export default MainLayout;