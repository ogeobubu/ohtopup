import React, { useState, useEffect } from "react";
import { FaCog, FaUser, FaShieldAlt, FaBell, FaWrench, FaPalette } from "react-icons/fa";
import Profile from "./profile";
import Security from "./security";
import Services from "./services";
import General from "./general";
import Notification from "./notification";
import Sidebar from "./sidebar";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Profile");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [activeTab]);

  return (
    <div>
      <div className="ot-dashboard-heading"><div><h1>Settings</h1><p>Manage your profile, security, and platform preferences.</p></div></div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-6 md:-mt-8 mb-6 md:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="ot-admin-paper rounded-lg p-4 md:p-6 border ot-admin-border transition-all duration-300">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="ot-admin-neutral-card w-10 md:w-12 h-10 md:h-12 rounded-lg flex items-center justify-center">
                <FaUser className="text-white text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm ot-admin-muted">Profile Status</p>
                <p className="text-base md:text-lg font-semibold ot-admin-ink">Complete</p>
              </div>
            </div>
          </div>

          <div className="ot-admin-paper rounded-lg p-4 md:p-6 border ot-admin-border transition-all duration-300">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="ot-admin-neutral-card w-10 md:w-12 h-10 md:h-12 rounded-lg flex items-center justify-center">
                <FaShieldAlt className="text-white text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm ot-admin-muted">Security Level</p>
                <p className="text-base md:text-lg font-semibold ot-admin-ink">High</p>
              </div>
            </div>
          </div>

          <div className="ot-admin-paper rounded-lg p-4 md:p-6 border ot-admin-border transition-all duration-300">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="ot-admin-neutral-card w-10 md:w-12 h-10 md:h-12 rounded-lg flex items-center justify-center">
                <FaBell className="text-white text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm ot-admin-muted">Notifications</p>
                <p className="text-base md:text-lg font-semibold ot-admin-ink">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6 md:mb-8">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-12">
        <div className="ot-admin-paper rounded-lg border ot-admin-border overflow-hidden">
          {/* Tab Header */}
          <div className="ot-admin-neutral-card px-4 md:px-8 py-4 md:py-6 border-b ot-admin-border">
            <div className="flex items-center gap-2 md:gap-3">
              {activeTab === "Profile" && <FaUser className="text-blue-600 text-lg md:text-xl" />}
              {activeTab === "General" && <FaPalette className="text-purple-600 text-lg md:text-xl" />}
              {activeTab === "Security" && <FaShieldAlt className="text-green-600 text-lg md:text-xl" />}
              {activeTab === "Notification" && <FaBell className="text-orange-600 text-lg md:text-xl" />}
              {activeTab === "Services" && <FaWrench className="text-indigo-600 text-lg md:text-xl" />}
              <h2 className="text-lg md:text-2xl font-bold ot-admin-ink">{activeTab}</h2>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-8">
            {activeTab === "Profile" && <Profile />}
            {activeTab === "General" && <General />}
            {activeTab === "Security" && <Security />}
            {activeTab === "Notification" && <Notification />}
            {activeTab === "Services" && <Services />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;