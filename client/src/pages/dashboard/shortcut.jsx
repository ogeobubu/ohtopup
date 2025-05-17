import React from "react";
import { FaBolt, FaWifi, FaPhone, FaTv } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Shortcut = () => {
  const isDarkMode = useSelector(state => state.theme.isDarkMode);

  return (
    <div className={`md:p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/utilities?id=data"
          className={`shadow-lg rounded-lg p-4 flex flex-col items-center justify-center transition-transform transform hover:scale-105 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="bg-blue-500 rounded-full p-3 mb-2">
            <FaWifi className="text-white text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-center">Buy Data</h3>
          <p className="text-sm text-center">Get more data for your device.</p>
        </Link>

        <Link
          to="/utilities?id=airtime"
          className={`shadow-lg rounded-lg p-4 flex flex-col items-center justify-center transition-transform transform hover:scale-105 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="bg-blue-500 rounded-full p-3 mb-2">
            <FaPhone className="text-white text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-center">Buy Airtime</h3>
          <p className="text-sm text-center">Recharge your phone with ease.</p>
        </Link>

        <Link
          to="/utilities?id=tv"
          className={`shadow-lg rounded-lg p-4 flex flex-col items-center justify-center transition-transform transform hover:scale-105 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="bg-blue-500 rounded-full p-3 mb-2">
            <FaTv className="text-white text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-center">Buy Cable</h3>
          <p className="text-sm text-center">Subscribe to your favorite channels.</p>
        </Link>

        <Link
          to="/utilities?id=electricity"
          className={`shadow-lg rounded-lg p-4 flex flex-col items-center justify-center transition-transform transform hover:scale-105 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="bg-blue-500 rounded-full p-3 mb-2">
            <FaBolt className="text-white text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-center">Electricity</h3>
          <p className="text-sm text-center">Purchase electricity here today!</p>
        </Link>
      </div>
    </div>
  );
};

export default Shortcut;