const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = ["Profile", "General", "Security", "Notification", "Services"];
  return (
    <nav
      className="mb-6 flex min-w-0 max-w-full justify-start gap-4 overflow-x-auto border-b border-line overscroll-x-contain md:justify-between md:gap-[30px]"
      aria-label="Settings sections"
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          aria-pressed={activeTab === tab}
          onClick={() => setActiveTab(tab)}
          className={[
            'flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent bg-transparent px-0 pb-3.5 text-xs text-muted',
            activeTab === tab ? 'border-accent text-accent' : '',
          ].join(' ')}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default Sidebar;
