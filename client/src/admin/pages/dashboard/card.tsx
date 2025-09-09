import React from "react";

const Card = ({ title, count, icon: Icon, bgColor }) => {
  return (
    <div className={`${bgColor} rounded-md shadow-md p-3 w-full`}>
      <div className="flex items-center">
        <div
          className={`${bgColor.replace(
            "200",
            "500"
          )} text-white rounded-full p-2`}
        >
          <Icon size={20} />
        </div>
        <div className="ml-2 flex-1">
          <span className="text-xs text-gray-700 block leading-tight">{title}</span>
          <span className="block text-lg font-bold text-gray-900 leading-tight">
            {count}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Card;
