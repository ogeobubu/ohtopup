import React from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar className="w-64 bg-gray-800 text-white" />
      <div className="flex-1 md:ml-48 ml-0 py-4 px-8 md:px-16">
        <div className="mb-5">
          <Header />
        </div>
        <Outlet />
        <p className="text-center text-gray-300 my-8 py-6">
          Copyright 2024, OhTopUp Inc.
        </p>
      </div>
    </div>
  );
};

export default MainLayout;
