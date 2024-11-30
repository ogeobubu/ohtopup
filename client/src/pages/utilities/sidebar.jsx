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
    <div className="flex flex-col gap-8">
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`border border-solid rounded-md bg-[#F7F9FB] cursor-pointer transition-colors duration-200 ${
            activeTab === tab.name
              ? "border-blue-600 text-gray-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-100"
          } flex w-64 items-center space-x-4 px-4 py-4`}
          onClick={() => handleTabClick(tab)}
        >
          <tab.icon
            className={`w-6 h-6 ${activeTab === tab.name && "text-blue-500"}`}
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