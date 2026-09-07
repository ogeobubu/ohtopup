const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = ["Profile", "General", "Security", "Notification", "Services"];
  return (
    <nav className="ot-utility-tabs" aria-label="Settings sections">
      {tabs.map((tab) => (
        <button key={tab} aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</button>
      ))}
    </nav>
  );
};

export default Sidebar;
