import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Data from "./data";
import Cable from "./cable";
import Sidebar from "./sidebar";

const Utilities = () => {
  const [activeTab, setActiveTab] = useState("airtime");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeTab]);

  return (
    <>
      <h1 className="text-2xl font-bold mb-5">Utility Bills & Airtime</h1>
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 px-8">
          {activeTab === "data" && <Data />}
          {activeTab === "tv" && <Cable />}
        </div>
      </div>
    </>
  );
};

export default Utilities;
