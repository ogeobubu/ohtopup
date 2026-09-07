const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = ["Contact", "Ticket"];
  return (
    <nav className="ot-utility-tabs" aria-label="Support sections">
      {tabs.map((tab) => (
        <button key={tab} aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab === "Contact" ? "Contact Us" : "Send us a message"}</button>
      ))}
    </nav>
  );
};

export default Sidebar;
