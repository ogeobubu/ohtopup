import React from "react";
import { FaWallet } from "react-icons/fa";

interface CardProps {
  title: string;
  balance?: number;
  color: string;
  onClick: () => void;
  isActive: boolean;
}

const Card: React.FC<CardProps> = ({ title, balance, color, onClick, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center p-4 rounded-sm border border-gray-300 dark:border-gray-600 border-solid w-full text-left transition 
        ${isActive ? `bg-[#F1F4FC] text-blue-400 border-2 border-blue-700 dark:bg-gray-800 dark:text-blue-300 dark:border-blue-600` : ''}`}
    >
      <div className={`text-${color}-500 dark:text-${color}-400 mr-4`}>
        <FaWallet size={24} />
      </div>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
    </button>
  );
};

export default Card;