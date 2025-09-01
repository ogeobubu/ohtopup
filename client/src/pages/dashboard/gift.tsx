import React from 'react';
import { useNavigate } from "react-router-dom";
import { FaChevronRight } from 'react-icons/fa';

const GiftPoint = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#B7BDCD] p-4 rounded-md shadow-md hover:shadow-lg transition-shadow duration-300">
      <h1 className="font-bold text-lg text-[#0B2253]">Introducing Gift Points</h1>
      <p className="text-sm text-gray-700 dark:text-gray-900">
        Get rewarded for completing transactions on your favorite platform.
      </p>
      <button onClick={() => navigate("/wallet")} className="mt-2 flex items-center text-blue-600 font-bold hover:text-blue-800 transition-colors duration-200">
        Learn More
        <FaChevronRight className="ml-2" />
      </button>
    </div>
  );
};

export default GiftPoint;