import React from "react";

const NetworkProviderSelector = ({
  providers,
  selectedProvider,
  onProviderChange,
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-evenly', gap: 16, border: '1px solid var(--ot-line)', padding: '8px 0' }}>
      {providers?.map((provider) => {
        return (
            <button
              key={provider.serviceID}
              type="button"
              style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                width: 36, height: 36, borderRadius: '50%',
                border: selectedProvider === provider.serviceID ? '2px solid var(--ot-accent)' : '2px solid transparent',
                background: 'transparent', cursor: 'pointer'
              }}
              onClick={() => onProviderChange(provider.serviceID)}
            >
              <img
                src={provider?.image}
                alt={provider.serviceID}
                style={{ width: 32, height: 32, borderRadius: '50%' }}
              />
            </button>
          )
      })}
    </div>
  );
};

export default NetworkProviderSelector;
