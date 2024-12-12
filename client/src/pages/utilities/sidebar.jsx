import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaMobileAlt,
  FaWifi,
  FaBolt,
  FaTv,
  FaMoneyBill,
} from "react-icons/fa";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    {
      label: "Buy Airtime",
      icon: FaMobileAlt,
      name: "airtime",
      link: "/utilities?id=airtime",
    },
    {
      label: "Buy Data",
      icon: FaWifi,
      name: "data",
      link: "/utilities?id=data",
    },
    {
      label: "Electricity Bill",
      icon: FaBolt,
      name: "electricity",
      link: "/utilities?id=electricity",
    },
    {
      label: "Cable TV",
      icon: FaTv,
      name: "tv",
      link: "/utilities?id=tv",
    },
    // Uncomment if needed
    // {
    //   label: "Fund Betting Account",
    //   icon: FaMoneyBill,
    //   name: "fund",
    //   link: "/utilities?id=fund",
    // },
  ];

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("id");

    if (id) {
      const activeTab = tabs.find(tab => tab.link.includes(`?id=${id}`));
      if (activeTab) {
        setActiveTab(activeTab.name);
      }
    }
  }, [location.search, setActiveTab, tabs]);

  const handleTabClick = (tab) => {
    setActiveTab(tab.name);
    navigate(tab.link);
  };

  return (
    <div className="flex flex-col md:gap-8 gap-3">
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`border border-solid rounded-md transition-colors duration-200 ${
            activeTab === tab.name
              ? "border-blue-600 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200"
              : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:dark:bg-gray-700"
          } flex w-full md:w-64 items-center space-x-4 px-4 py-4 cursor-pointer`}
          onClick={() => handleTabClick(tab)}
        >
          <tab.icon
            className={`w-6 h-6 ${activeTab === tab.name ? "text-blue-500 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
          />
          <div className="flex flex-col gap-1">
            <span>{tab.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;