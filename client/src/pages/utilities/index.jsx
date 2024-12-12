import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux"; // Import useSelector
import Airtime from "./airtime";
import Data from "./data";
import Cable from "./cable";
import Electricity from "./electricity";
import Sidebar from "./sidebar";
import { getUser } from "../../api";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("airtime");
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const { data: user, error: userError } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeTab]);

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"}`}>
      <h1 className="text-2xl font-bold mb-5">Utility Bills & Airtime</h1>
      <div className="flex md:flex-row flex-col">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 md:px-8 mt-3 md:mt-0">
          {activeTab === "airtime" && <Airtime user={user} isDarkMode={isDarkMode} />}
          {activeTab === "data" && <Data isDarkMode={isDarkMode} />}
          {activeTab === "tv" && <Cable isDarkMode={isDarkMode} />}
          {activeTab === "electricity" && <Electricity isDarkMode={isDarkMode} />}
        </div>
      </div>
    </div>
  );
};

export default Settings;