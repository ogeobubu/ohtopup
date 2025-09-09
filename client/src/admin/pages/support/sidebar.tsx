import {
  FaEnvelope,
  FaComments,
} from "react-icons/fa";

const Sidebar = ({ activeTab, setActiveTab, className }) => {
  const tabs = [
    {
      label: "X API",
      subtitle: "",
      icon: FaComments,
      name: "XPost",
    },
    {
      label: "Contact Us",
      subtitle: "",
      icon: FaEnvelope,
      name: "Contact",
    },
    {
      label: "Send us a message",
      subtitle: "",
      icon: FaComments,
      name: "Ticket",
    },
   
    
    // {
    //   label: "Chat Us",
    //   subtitle: "",
    //   icon: FaComments,
    //   name: "Chat",
    // },
  ];

  return (
    <div className={`flex flex-col gap-2 md:gap-3 ${className}`}>
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`border border-solid rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
            activeTab === tab.name
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md"
              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          } flex w-full items-center space-x-3 md:space-x-4 px-3 md:px-4 py-3 md:py-4`}
          onClick={() => setActiveTab(tab.name)}
        >
          <tab.icon
            className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${activeTab === tab.name ? "text-blue-500" : "text-gray-500"}`}
          />
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-sm md:text-base font-medium truncate">{tab.label}</span>
            {tab.subtitle && (
              <small className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{tab.subtitle}</small>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar