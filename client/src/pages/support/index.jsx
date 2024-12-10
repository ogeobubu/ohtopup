import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux"; // Import useSelector
import Sidebar from "./sidebar";
import Contact from "./contact";
import Ticket from "./ticket";
import Chat from "./chat";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Contact");
  const isDarkMode = useSelector((state) => state.theme.isDarkMode); // Get theme state

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeTab]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'}`}>
      <h1 className="text-2xl font-bold mb-5">Help & Support</h1>
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 px-8">
          {activeTab === "Contact" && <Contact />}
          {activeTab === "Ticket" && <Ticket />}
          {activeTab === "Chat" && <Chat />}
        </div>
      </div>
    </div>
  );
};

export default Settings;