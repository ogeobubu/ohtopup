import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import Airtime from "./airtime";
import Data from "./data";
import Cable from "./cable";
import Electricity from "./electricity";
import { useSearchParams } from "react-router-dom";
import { FiSmartphone, FiWifi, FiZap, FiTv } from "react-icons/fi";
import { getUser } from "../../api";

const Settings = () => {
  const [params, setParams] = useSearchParams();
  const tabs = [
    ["airtime", "Airtime", FiSmartphone],
    ["data", "Data", FiWifi],
    ["electricity", "Electricity", FiZap],
    ["tv", "TV", FiTv],
  ] as const;
  const activeTab = tabs.some(([id]) => id === params.get("id")) ? params.get("id") : "airtime";
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const { data: user } = useQuery({
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
    <div className="min-w-0">
      <div className="mb-[30px] flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">
            Make a payment
          </h1>
          <p className="text-[13px] text-muted">Choose an everyday essential to get started.</p>
        </div>
      </div>
      <div>
        <nav className="mb-5 flex flex-wrap gap-6 border-b border-line" aria-label="Payment services">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              aria-pressed={activeTab === id}
              onClick={() => setParams({ id })}
              className={[
                "-mb-px flex min-h-11 items-center gap-2 border-b-2 pb-3 text-xs font-mediumish transition-colors",
                activeTab === id ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
              ].join(" ")}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
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
