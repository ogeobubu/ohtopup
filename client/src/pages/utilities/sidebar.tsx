import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaMobileAlt,
  FaWifi,
  FaBolt,
  FaTv,
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
    <div className="flex flex-col gap-3 md:gap-8">
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`flex w-full cursor-pointer items-center space-x-4 rounded-md border border-solid px-4 py-4 transition-colors duration-200 ${
            activeTab === tab.name
              ? "border-accent bg-line text-muted"
              : "border-line text-muted hover:bg-bg"
          } md:w-64`}
          onClick={() => handleTabClick(tab)}
        >
          <tab.icon
            className={`h-6 w-6 ${activeTab === tab.name ? "text-accent" : "text-muted"}`}
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
