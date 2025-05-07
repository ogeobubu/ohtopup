import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Sidebar from "./sidebar"; // Assuming Sidebar is a block-level element or its container is
import XPost from "./ai/x";
import Contact from "./contact";
import Ticket from "./ticket";
import Chat from "./chat";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Ticket");
  const isDarkMode = useSelector(state => state.theme.isDarkMode);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeTab]);

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}> {/* Added responsive padding */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center md:text-left">Help & Support</h1> {/* Responsive text size and alignment */}
      {/* Main layout container: stacks on small screens, side-by-side on medium screens and up */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8"> {/* Added responsive flex direction and gap */}
        {/* Sidebar container */}
        <div className="w-full md:w-64 flex-shrink-0"> {/* Full width on small, fixed width on medium+ */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Content area */}
        <div className="flex-1 px-4 sm:px-6 md:px-8"> {/* Adjusted padding */}
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