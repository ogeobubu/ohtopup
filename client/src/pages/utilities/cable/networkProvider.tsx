import React from "react";

const NetworkProviderSelector = ({
  providers,
  selectedProvider,
  onProviderChange,
}) => {
  return (
    <div className="flex justify-evenly space-x-4 border border-solid border-gray-300 py-2">
      {providers?.map((provider) => {
        return (
            <button
              key={provider.serviceID}
              type="button"
              className={`flex justify-center items-center rounded-full h-9 w-9 ${
                selectedProvider === provider.serviceID
                  ? "border-2 border-blue-500"
                  : "border-0"
              }`}
              onClick={() => onProviderChange(provider.serviceID)}
            >
              <img
                src={provider?.image}
                alt={provider.serviceID}
                className="h-8 w-8 rounded-full"
              />
            </button>
          )
      })}
    </div>
  );
};

export default NetworkProviderSelector;
