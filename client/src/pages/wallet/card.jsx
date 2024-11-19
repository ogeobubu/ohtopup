import { FaWallet } from "react-icons/fa";

const Card = ({ title, balance, color, onClick, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center p-4 rounded-sm border border-gray-300 border-solid w-full text-left transition ${
        isActive && `bg-[#F1F4FC] text-blue-400 border-2 border-blue-700`
      }`}
    >
      <div className={`text-${isActive ? `${color}-500` : `${color}-500`} mr-4`}>
        <FaWallet size={24} />
      </div>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
    </button>
  );
};

export default Card;
