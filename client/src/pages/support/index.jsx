import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Contact from "./contact";
import Chat from "./chat";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Contact");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeTab]);

  return (
    <>
      <h1 className="text-2xl font-bold mb-5">Help & Support</h1>
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 px-8">
          {activeTab === "Contact" && <Contact />}
          {activeTab === "Chat" && <Chat />}
        </div>
      </div>
    </>
  );
};

export default Settings;
