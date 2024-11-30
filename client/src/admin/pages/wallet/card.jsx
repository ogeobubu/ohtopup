import React from "react";

const Card = ({ title, count, icon: Icon, bgColor }) => {
  return (
    <div className={`${bgColor} rounded-md shadow-md p-4 w-48`}>
      <div className="flex items-center">
        <div
          className={`${bgColor.replace(
            "200",
            "500"
          )} text-white rounded-full p-3`}
        >
          <Icon size={24} />
        </div>
        <div className="ml-3">
          <span className="text-sm text-gray-700">{title}</span>
          <span className="block text-xl font-bold text-gray-900">
            {count}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Card;
