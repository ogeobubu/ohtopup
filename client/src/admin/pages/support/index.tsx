import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Sidebar from "./sidebar";
import XPost from "./ai/x";
import Contact from "./contact";
import Ticket from "./ticket";
import Chat from "./chat";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("XPost");
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeTab]);

  return (
    <div
      className={`min-h-screen p-2 md:p-6 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
      }`}
    >
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center md:text-left">
          Help & Support
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 text-center md:text-left mt-2">
          Get help and support for your admin needs
        </p>
      </div>

      {/* Main layout container: stacks on small screens, side-by-side on medium screens and up */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar container */}
        <div className="w-full md:w-64 flex-shrink-0">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} className="" />
        </div>
        {/* Content area */}
        <div className="w-full min-w-0">
          {activeTab === "Ticket" && <Ticket isDarkMode={isDarkMode} />}
          {activeTab === "Contact" && <Contact />}
          {activeTab === "Chat" && <Chat />}
          {activeTab === "XPost" && <XPost />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
