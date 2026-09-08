import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Profile from "./profile";
import Security from "./security";
import Services from "./services";
import General from "./general";
import Notification from "./notification";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Profile");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "Profile":
        return <Profile />;
      case "General":
        return <General />;
      case "Security":
        return <Security />;
      case "Notification":
        return <Notification />;
      case "Services":
        return <Services />;
      default:
        return <Profile />;
    }
  };

  return (
    <div className="min-h-screen p-2 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="ot-admin-page-title text-xl md:text-2xl lg:text-3xl font-bold text-center md:text-left">
          Settings
        </h1>
        <p className="text-sm md:text-base ot-admin-muted text-center md:text-left mt-2">
          Manage your profile, security, and platform preferences.
        </p>
      </div>

      {/* Two-column layout: sidebar + content */}
      <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
        <div className="w-full xl:w-64 flex-shrink-0">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="w-full min-w-0">{renderContent()}</div>
      </div>
    </div>
  );
};

export default Settings;
