import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Profile from "./profile";
import Security from "./security";
import Services from "./services";
import General from "./general";
import Notification from "./notification";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [activeTab]);

  const tabs = ["Profile", "General", "Security", "Notification", "Services"];

  return (
    <div className="ot-dashboard">
      <div className="ot-dashboard-heading"><div><h1>Account Settings</h1><p>Customize your preferences, security, and notifications</p></div></div>

      <nav className="ot-utility-tabs" aria-label="Settings sections">
        {tabs.map((tab) => (
          <button key={tab} aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </nav>

      <section className="ot-panel">
        <div className="ot-panel-heading"><div><h2>{activeTab}</h2></div></div>
        <div style={{ padding: '0 24px 24px' }}>
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
