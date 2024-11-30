import React from "react";
import { FaBolt, FaWifi, FaPhone, FaTv } from "react-icons/fa";
import { Link } from "react-router-dom";

const Shortcut = () => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/utilities?id=data"
          className="bg-white shadow-lg rounded-lg p-4 flex flex-col items-center justify-center transition-transform transform hover:scale-105"
        >
          <div className="bg-blue-500 rounded-full p-3 mb-2">
            <FaWifi className="text-white text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 text-center">Buy Data</h3>
          <p className="text-gray-600 text-sm text-center">Get more data for your device</p>
        </Link>

        <Link
          to="/utilities?id=airtime"
          className="bg-white shadow-lg rounded-lg p-4 flex flex-col items-center justify-center transition-transform transform hover:scale-105"
        >
          <div className="bg-blue-500 rounded-full p-3 mb-2">
            <FaPhone className="text-white text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 text-center">Buy Airtime</h3>
          <p className="text-gray-600 text-sm text-center">Recharge your phone with ease</p>
        </Link>

        <Link
          to="/utilities?id=tv"
          className="bg-white shadow-lg rounded-lg p-4 flex flex-col items-center justify-center transition-transform transform hover:scale-105"
        >
          <div className="bg-blue-500 rounded-full p-3 mb-2">
            <FaTv className="text-white text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 text-center">Buy Cable</h3>
          <p className="text-gray-600 text-sm text-center">Subscribe to your favorite channels</p>
        </Link>

        <Link
          to="/utilities?id=electricity"
          className="bg-white shadow-lg rounded-lg p-4 flex flex-col items-center justify-center transition-transform transform hover:scale-105"
        >
          <div className="bg-blue-500 rounded-full p-3 mb-2">
            <FaBolt className="text-white text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 text-center">Electricity</h3>
          <p className="text-gray-600 text-sm text-center">Purchase electricity here today!</p>
        </Link>
      </div>
    </div>
  );
};

export default Shortcut;