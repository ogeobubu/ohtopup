import {
  FaUserCircle,
  FaCog,
  FaShieldAlt,
  FaBell,
  FaCheckCircle,
} from "react-icons/fa";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      label: "Profile and KYC Settings",
      subtitle: "View and edit your profile.",
      icon: FaUserCircle,
      name: "Profile",
    },
    {
      label: "General Settings",
      subtitle: "General settings and themes.",
      icon: FaCog,
      name: "General",
    },
    {
      label: "Security Settings",
      subtitle: "Update PIN and Password.",
      icon: FaShieldAlt,
      name: "Security",
    },
    {
      label: "Notification",
      subtitle: "Send email notifications",
      icon: FaBell,
      name: "Notification",
    },
    {
      label: "Services Status",
      subtitle: "Available and unavailable services",
      icon: FaCheckCircle,
      name: "Services",
    },
  ];

  return (
    <div className="flex flex-col md:gap-8 gap-3">
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`border border-solid rounded-md cursor-pointer transition-colors duration-200 ${
            activeTab === tab.name
              ? "border-green-600 text-gray-600 dark:border-green-400 dark:text-gray-300"
              : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
          } flex w-full md:w-64 items-center space-x-4 px-4 py-4`}
          onClick={() => setActiveTab(tab.name)}
        >
          <tab.icon
            className={`w-6 h-6 ${activeTab === tab.name ? "text-green-500 dark:text-green-400" : "text-gray-500 dark:text-gray-300"}`}
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