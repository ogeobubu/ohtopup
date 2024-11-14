import { FaUserCircle, FaCog, FaLock, FaVideo } from "react-icons/fa";

const Sidebar = ({ activeTab, setActiveTab }) => {
    const tabs = [
      { label: "Profile and KYC Settings", subtitle: "View and edit your profile.", icon: FaUserCircle, name: "Profile" },
      { label: "General Settings", subtitle: "General settings and themes.", icon: FaCog, name: "General" },
      { label: "Security Settings", subtitle: "Update PIN and Password.", icon: FaLock, name: "Security" },
      { label: "Services Status", subtitle: "Available and unavailable services", icon: FaVideo, name: "Services" },
    ];
  
    return (
      <div className="flex flex-col gap-8">
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={`border border-solid rounded-md cursor-pointer transition-colors duration-200 ${
              activeTab === tab.name
                ? "border-blue-600 text-gray-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-100"
            } flex w-64 items-center space-x-4 px-4 py-4`}
            onClick={() => setActiveTab(tab.name)}
          >
            <tab.icon
              className={`w-6 h-6 ${activeTab === tab.name && "text-blue-500"}`}
            />
            <div className="flex flex-col gap-1">
            <span>{tab.label}</span>
            <small>{tab.subtitle}</small>
            </div>
          </div>
        ))}
      </div>
    );
  };

  export default Sidebar;