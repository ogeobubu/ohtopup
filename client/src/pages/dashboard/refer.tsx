import React from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

const Refer = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <span className="text-green-600 text-lg">👥</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Refer & Earn</h3>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Earn 1 gift point per successful referral
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-green-800 dark:text-green-400">Reward</div>
            <div className="text-lg font-bold text-green-900 dark:text-green-300">1 Point</div>
          </div>
          <div className="text-xl">🎁</div>
        </div>
      </div>

      <div className="mt-auto">
        <button
          onClick={() => navigate("/referral")}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm"
        >
          Start Referring
          <FaChevronRight className="text-xs" />
        </button>
      </div>
    </div>
  );
};

export default Refer;