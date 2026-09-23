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
          className={`flex w-full cursor-pointer items-center space-x-3 rounded-lg border border-solid px-3 py-3 transition-all duration-200 md:space-x-4 md:px-4 md:py-4 ${
            activeTab === tab.name
              ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
              : "border-line text-muted hover:bg-bg"
          }`}
          onClick={() => setActiveTab(tab.name)}
        >
          <tab.icon
            className={`h-4 w-4 flex-shrink-0 md:h-5 md:w-5 ${
              activeTab === tab.name ? "text-blue-500" : "text-muted"
            }`}
          />
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-sm md:text-base font-medium truncate">
              {tab.label}
            </span>
            <small className="truncate text-xs text-muted md:text-sm">
              {tab.subtitle}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
