import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Contact from "./contact";
import Ticket from "./ticket";
import Chat from "./chat";

const Support = () => {
  const [activeTab, setActiveTab] = useState("Contact");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  return (
    <div className="min-w-0">
      <div className="mb-[30px] flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">Help & Support</h1>
          <p className="text-[13px] text-muted">Get help, contact support, or create a ticket</p>
        </div>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <section className="overflow-hidden rounded-lg border border-line bg-paper">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.2px]">
              {activeTab === "Contact" ? "Contact Us" : activeTab === "Ticket" ? "Send us a message" : "Live Chat"}
            </h2>
          </div>
        </div>
        <div className="px-6 pb-6">
          {activeTab === "Contact" && <Contact />}
          {activeTab === "Ticket" && <Ticket />}
          {activeTab === "Chat" && <Chat />}
        </div>
      </section>
    </div>
  );
};

export default Support;
