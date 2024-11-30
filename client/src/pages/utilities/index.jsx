import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Airtime from "./airtime";
import Data from "./data";
import Cable from "./cable";
import Electricity from "./electricity";
import Sidebar from "./sidebar";
import { getUser } from "../../api";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("airtime");

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
    <>
      <h1 className="text-2xl font-bold mb-5">Utility Bills & Airtime</h1>
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 px-8">
          {activeTab === "airtime" && <Airtime user={user} />}
          {activeTab === "data" && <Data />}
          {activeTab === "tv" && <Cable />}
          {activeTab === "electricity" && <Electricity />}
        </div>
      </div>
    </>
  );
};

export default Settings;
