import {
  FaEnvelope,
  FaComments,
} from "react-icons/fa";

const Sidebar = ({ activeTab, setActiveTab, className }) => {
  const tabs = [
    {
      label: "Contact Us",
      subtitle: "",
      icon: FaEnvelope,
      name: "Contact",
    },
    {
      label: "Send us a message",
      subtitle: "",
      icon: FaEnvelope,
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
    <div className={`flex flex-col md:gap-8 gap-3 ${className}`}>
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`border border-solid rounded-md cursor-pointer transition-colors duration-200 ${
            activeTab === tab.name
              ? "border-blue-600 text-gray-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-100"
          } flex w-full md:w-64 items-center space-x-4 px-4 py-4`}
          onClick={() => setActiveTab(tab.name)}
        >
          <tab.icon
            className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === tab.name && "text-blue-500"}`}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm md:text-base">{tab.label}</span>
            <small className="text-xs md:text-sm">{tab.subtitle}</small>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar