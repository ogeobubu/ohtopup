import {
  FaUser,
  FaCog,
  FaShieldAlt,
  FaBell,
  FaCheckCircle,
} from "react-icons/fa";

const tabs = [
  {
    label: "Profile",
    subtitle: "Account info & stats",
    icon: FaUser,
    name: "Profile",
  },
  {
    label: "General",
    subtitle: "Appearance & theme",
    icon: FaCog,
    name: "General",
  },
  {
    label: "Security",
    subtitle: "Password & 2FA",
    icon: FaShieldAlt,
    name: "Security",
  },
  {
    label: "Notifications",
    subtitle: "Alerts & messages",
    icon: FaBell,
    name: "Notification",
  },
  {
    label: "Services",
    subtitle: "Manage platform services",
    icon: FaCheckCircle,
    name: "Services",
  },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      {tabs.map((tab) => (
        <div
          key={tab.name}
          className={`border border-solid rounded-lg cursor-pointer transition-all duration-200 ${
            activeTab === tab.name
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
              : "ot-admin-border ot-admin-muted hover:bg-gray-50 dark:hover:bg-gray-700"
          } flex w-full items-center space-x-3 md:space-x-4 px-3 md:px-4 py-3 md:py-4`}
          onClick={() => setActiveTab(tab.name)}
        >
          <tab.icon
            className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${
              activeTab === tab.name
                ? "text-blue-500"
                : "ot-admin-muted"
            }`}
          />
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-sm md:text-base font-medium truncate">
              {tab.label}
            </span>
            <small className="text-xs md:text-sm ot-admin-muted truncate">
              {tab.subtitle}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
