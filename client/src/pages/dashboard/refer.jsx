import React from 'react';
import { FaChevronRight } from 'react-icons/fa';

const Refer = () => {
  return (
    <div className="bg-[#D8DCE4] p-4 rounded-md shadow-md hover:shadow-lg transition-shadow duration-300">
      <h1 className="font-bold text-lg text-[#0B2253]">Refer and Earn</h1>
      <p className="text-sm text-gray-700">
        Refer a friend and earn 3000 gift points once they make a purchase.
      </p>
      <button className="mt-2 flex items-center text-blue-600 font-bold hover:text-blue-800 transition-colors duration-200">
        Refer Now
        <FaChevronRight className="ml-2" />
      </button>
    </div>
  );
};

export default Refer;