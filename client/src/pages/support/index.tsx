import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Contact from "./contact";
import Ticket from "./ticket";
import Chat from "./chat";

const Support = () => {
  const [activeTab, setActiveTab] = useState("Contact");

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [activeTab]);

  return (
    <div className="ot-dashboard">
      <div className="ot-dashboard-heading"><div><h1>Help & Support</h1><p>Get help, contact support, or create a ticket</p></div></div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <section className="ot-panel">
        <div className="ot-panel-heading"><div><h2>{activeTab === "Contact" ? "Contact Us" : activeTab === "Ticket" ? "Send us a message" : "Live Chat"}</h2></div></div>
        <div style={{ padding: '0 24px 24px' }}>
          {activeTab === "Contact" && <Contact />}
          {activeTab === "Ticket" && <Ticket />}
          {activeTab === "Chat" && <Chat />}
        </div>
      </section>
    </div>
  );
};

export default Support;
