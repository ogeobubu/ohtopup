import { useState, useEffect } from "react";
import Profile from "./profile";
import Security from "./security";
import Services from "./services";
import General from "./general";
import Notification from "./notification";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Profile");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const tabs = ["Profile", "General", "Security", "Notification", "Services"];

  return (
    <div className="min-w-0">
      <div className="mb-[30px] flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">Account Settings</h1>
          <p className="text-[13px] text-muted">Customize your preferences, security, and notifications</p>
        </div>
      </div>

      <nav className="flex flex-wrap gap-6 border-b border-line" aria-label="Settings sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "-mb-px min-h-11 border-b-2 pb-3 text-xs font-mediumish transition-colors",
              activeTab === tab
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink",
            ].join(" ")}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="mt-5 overflow-hidden rounded-lg border border-line bg-paper">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]">
          <h2 className="text-[15px] font-semibold tracking-[-0.2px]">{activeTab}</h2>
        </div>
        <div className="px-6 pb-6">
          {activeTab === "Profile" && <Profile />}
          {activeTab === "General" && <General />}
          {activeTab === "Security" && <Security />}
          {activeTab === "Notification" && <Notification />}
          {activeTab === "Services" && <Services />}
        </div>
      </section>
    </div>
  );
};

export default Settings;
