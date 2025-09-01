import React from "react";
import { FaWifi, FaTv } from "react-icons/fa";
import { Link } from "react-router-dom";

const Shortcut = () => {
  return (
    <div className="md:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <Link
          to="/admin/utilities?id=data"
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col items-center justify-center transition-transform transform hover:scale-105"
        >
          <div className="bg-green-500 rounded-full p-4 mb-3">
            <FaWifi className="text-white text-4xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 text-center">
            Buy Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
            Get more data for your device
          </p>
        </Link>

        <Link
          to="/admin/utilities?id=tv"
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col items-center justify-center transition-transform transform hover:scale-105"
        >
          <div className="bg-green-500 rounded-full p-4 mb-3">
            <FaTv className="text-white text-4xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 text-center">
            Buy Cable
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
            Subscribe to your favorite channels
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Shortcut;