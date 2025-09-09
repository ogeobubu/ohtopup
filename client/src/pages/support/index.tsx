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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full mb-4 md:mb-6 backdrop-blur-sm">
            <span className="text-2xl md:text-3xl">💬</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Help & Support</h1>
          <p className="text-blue-100 text-sm md:text-lg max-w-2xl mx-auto px-2">
            Get help, contact support, or create a ticket for assistance
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-6 md:-mt-8 mb-6 md:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className={`rounded-xl shadow-lg p-4 md:p-6 border hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-lg md:text-xl">📞</span>
              </div>
              <div>
                <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contact Support</p>
                <p className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Available</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg p-4 md:p-6 border hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-lg md:text-xl">🎫</span>
              </div>
              <div>
                <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Support Tickets</p>
                <p className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Active</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg p-4 md:p-6 border hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-lg md:text-xl">💬</span>
              </div>
              <div>
                <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Live Chat</p>
                <p className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6 md:mb-8">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} className="" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-12">
        <div className={`rounded-2xl shadow-xl border overflow-hidden ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          {/* Tab Header */}
          <div className={`px-4 md:px-8 py-4 md:py-6 border-b ${
            isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 md:gap-3">
              {activeTab === "Contact" && <span className="text-blue-600 text-lg md:text-xl">📞</span>}
              {activeTab === "Ticket" && <span className="text-green-600 text-lg md:text-xl">🎫</span>}
              {activeTab === "Chat" && <span className="text-purple-600 text-lg md:text-xl">💬</span>}
              <h2 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeTab}</h2>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-8">
            {activeTab === "Contact" && <Contact />}
            {activeTab === "Ticket" && <Ticket isDarkMode={isDarkMode} />}
            {activeTab === "Chat" && <Chat />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;