import {
    FaEnvelope,
    FaComments,
  } from "react-icons/fa";
  
  const Sidebar = ({ activeTab, setActiveTab }) => {
    const tabs = [
      {
        label: "Contact Us",
        subtitle: "",
        icon: FaEnvelope,
        name: "Contact",
      },
      // {
      //   label: "Chat Us",
      //   subtitle: "",
      //   icon: FaComments,
      //   name: "Chat",
      // },
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
  