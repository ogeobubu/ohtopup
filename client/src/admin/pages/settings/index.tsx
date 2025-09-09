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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 md:w-20 h-16 md:h-20 bg-white/20 rounded-full mb-4 md:mb-6 backdrop-blur-sm">
            <FaCog className="text-2xl md:text-3xl text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Admin Settings</h1>
          <p className="text-blue-100 text-sm md:text-lg max-w-2xl mx-auto px-4">
            Manage your admin preferences, security settings, and system configurations
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-6 md:-mt-8 mb-6 md:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 md:w-12 h-10 md:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaUser className="text-white text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Profile Status</p>
                <p className="text-base md:text-lg font-semibold text-gray-900">Complete</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 md:w-12 h-10 md:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <FaShieldAlt className="text-white text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Security Level</p>
                <p className="text-base md:text-lg font-semibold text-gray-900">High</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 md:w-12 h-10 md:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaBell className="text-white text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Notifications</p>
                <p className="text-base md:text-lg font-semibold text-gray-900">Active</p>
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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tab Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-8 py-4 md:py-6 border-b border-gray-200">
            <div className="flex items-center gap-2 md:gap-3">
              {activeTab === "Profile" && <FaUser className="text-blue-600 text-lg md:text-xl" />}
              {activeTab === "General" && <FaPalette className="text-purple-600 text-lg md:text-xl" />}
              {activeTab === "Security" && <FaShieldAlt className="text-green-600 text-lg md:text-xl" />}
              {activeTab === "Notification" && <FaBell className="text-orange-600 text-lg md:text-xl" />}
              {activeTab === "Services" && <FaWrench className="text-indigo-600 text-lg md:text-xl" />}
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">{activeTab}</h2>
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