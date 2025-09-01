import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Sidebar from "./sidebar";
import Contact from "./contact";
import Ticket from "./ticket";
import Chat from "./chat";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Contact");
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeTab]);

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'}`}>
      <h1 className="text-2xl md:text-3xl font-bold mb-5">Help & Support</h1>
      <div className="flex md:flex-row flex-col gap-3 md:gap-0 min-h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} className="w-full md:w-64" />
        <div className="flex-1 md:px-8">
          {activeTab === "Contact" && <Contact />}
          {activeTab === "Ticket" && <Ticket isDarkMode={isDarkMode} />}
          {activeTab === "Chat" && <Chat />}
        </div>
      </div>
    </div>
  );
};

export default Settings;