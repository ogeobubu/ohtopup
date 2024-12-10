import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux"; // Import useSelector
import Profile from "./profile";
import Security from "./security";
import Services from "./services";
import General from "./general";
import Notification from "./notification";
import Sidebar from "./sidebar";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [activeTab]);

  return (
    <>
      <h1 className={`text-2xl font-bold mb-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        Settings
      </h1>
      <div className={`flex flex-col md:flex-row ${isDarkMode ? 'bg-gray-900' : 'bg-white'} min-h-screen`}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className={`flex-1 md:px-8 px-0 md:my-0 my-3`}>
          {activeTab === "Profile" && <Profile />}
          {activeTab === "General" && <General />}
          {activeTab === "Security" && <Security />}
          {activeTab === "Notification" && <Notification />}
          {activeTab === "Services" && <Services />}
        </div>
      </div>
    </>
  );
};

export default Settings;