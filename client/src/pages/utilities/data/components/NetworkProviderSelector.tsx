import PropTypes from 'prop-types';

const NetworkProviderSelector = ({ providers, selectedProvider, onChange, isSubmitting }) => {
  return (
    <div className="flex flex-col">
      <label className="text-[#6d7a98]  mb-2">Select Data Provider</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {providers?.map((provider) => (
          <button
            key={provider.serviceID}
            type="button"
            className={`flex items-center p-4 rounded-lg border transition-all ${
              selectedProvider === provider.serviceID
                ? "bg-[var(--ot-tint)] dark:bg-blue-900 border-blue-500 dark:border-blue-400"
                : "border-[var(--ot-line)]  hover:bg-[var(--ot-bg)] "
            }`}
            onClick={() => onChange(provider.serviceID)}
            disabled={isSubmitting}
          >
            <div className="flex-1 text-left">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  selectedProvider === provider.serviceID
                    ? "bg-blue-500"
                    : "border-2 border-[var(--ot-line)] "
                }`}>
                  {selectedProvider === provider.serviceID && (
                    <div className="w-full h-full rounded-full bg-[var(--ot-paper)] scale-50"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-[var(--ot-ink)] dark:text-white">
                    {provider.name}
                    {provider.isDefault && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </h3>
                  {provider.description && (
                    <p className="text-sm text-[var(--ot-muted)]  mt-1">
                      {provider.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

NetworkProviderSelector.propTypes = {
  providers: PropTypes.array,
  selectedProvider: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

export default NetworkProviderSelector;