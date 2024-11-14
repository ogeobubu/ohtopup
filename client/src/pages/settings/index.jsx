import React, { useState } from "react";
import Profile from "./profile";
import Security from "./security";
import Services from "./services";
import General from "./general";
import Sidebar from "./sidebar";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  return (
    <>
      <h1 className="text-2xl font-bold mb-5">Settings</h1>
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 px-8">
          {activeTab === "Profile" && <Profile />}
          {activeTab === "General" && <General />}
          {activeTab === "Security" && <Security />}
          {activeTab === "Services" && <Services />}
        </div>
      </div>
    </>
  );
};

export default Settings;
