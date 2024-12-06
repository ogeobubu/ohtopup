import React from "react";
import { FaBolt, FaWifi, FaPhone, FaTv } from "react-icons/fa";
import { Link } from "react-router-dom";

const Shortcut = () => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <Link
          to="/admin/utilities?id=data"
          className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center transition-transform transform hover:scale-105"
        >
          <div className="bg-green-500 rounded-full p-4 mb-3">
            <FaWifi className="text-white text-4xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 text-center">Buy Data</h3>
          <p className="text-gray-600 text-sm text-center">Get more data for your device</p>
        </Link>

        <Link
          to="/admin/utilities?id=tv"
          className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center transition-transform transform hover:scale-105"
        >
          <div className="bg-green-500 rounded-full p-4 mb-3">
            <FaTv className="text-white text-4xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 text-center">Buy Cable</h3>
          <p className="text-gray-600 text-sm text-center">Subscribe to your favorite channels</p>
        </Link>

      </div>
    </div>
  );
};

export default Shortcut;