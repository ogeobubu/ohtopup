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
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
            <FaCog className="text-3xl text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Admin Settings</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Manage your admin preferences, security settings, and system configurations
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaUser className="text-white text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Profile Status</p>
                <p className="text-lg font-semibold text-gray-900">Complete</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <FaShieldAlt className="text-white text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Security Level</p>
                <p className="text-lg font-semibold text-gray-900">High</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaBell className="text-white text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Notifications</p>
                <p className="text-lg font-semibold text-gray-900">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tab Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {activeTab === "Profile" && <FaUser className="text-blue-600 text-xl" />}
              {activeTab === "General" && <FaPalette className="text-purple-600 text-xl" />}
              {activeTab === "Security" && <FaShieldAlt className="text-green-600 text-xl" />}
              {activeTab === "Notification" && <FaBell className="text-orange-600 text-xl" />}
              {activeTab === "Services" && <FaWrench className="text-indigo-600 text-xl" />}
              <h2 className="text-2xl font-bold text-gray-900">{activeTab}</h2>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
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