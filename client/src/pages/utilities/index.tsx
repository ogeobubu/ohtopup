import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux"; // Import useSelector
import Airtime from "./airtime";
import Data from "./data";
import Cable from "./cable";
import Electricity from "./electricity";
import { useSearchParams } from "react-router-dom";
import { FiSmartphone, FiWifi, FiZap, FiTv } from "react-icons/fi";
import { getUser } from "../../api";

const Settings = () => {
  const [params, setParams] = useSearchParams();
  const tabs = [["airtime", "Airtime", FiSmartphone], ["data", "Data", FiWifi], ["electricity", "Electricity", FiZap], ["tv", "TV", FiTv]] as const;
  const activeTab = tabs.some(([id]) => id === params.get("id")) ? params.get("id") : "airtime";
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
    <div>
      <div className="ot-dashboard-heading"><div><h1>Make a payment</h1><p>Choose an everyday essential to get started.</p></div></div>
      <div>
        <nav className="ot-utility-tabs" aria-label="Payment services">{tabs.map(([id, label, Icon]) => <button key={id} aria-pressed={activeTab === id} onClick={() => setParams({ id })}><Icon />{label}</button>)}</nav>
        <div>
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