import PropTypes from 'prop-types';
import mtn from '../../../../assets/mtn.svg';
import glo from '../../../../assets/glo.svg';
import airtel from '../../../../assets/airtel.svg';
import nineMobile from '../../../../assets/9mobile.svg';

const NetworkProviderSelector = ({ providers, selectedProvider, onChange, isSubmitting }) => {
  const getProviderImage = (serviceID) => {
    const providerMap = {
      'mtn': mtn,
      'mtn-data': mtn,
      'glo': glo,
      'glo-data': glo,
      'airtel': airtel,
      'airtel-data': airtel,
      'etisalat': nineMobile,
      'etisalat-data': nineMobile,
    };
    return providerMap[serviceID] || null;
  };

  const getProviderName = (serviceID) => {
    return serviceID?.replace('-data', '').toUpperCase();
  };

  return (
    <div className="flex flex-col space-y-3">
      <label className="text-gray-700 dark:text-gray-300 font-medium flex items-center">
        <svg className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Select Network Provider
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
        {providers?.map((provider) => (
          <button
            key={provider.serviceID}
            type="button"
            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
              selectedProvider === provider.serviceID
                ? "bg-white dark:bg-gray-800 shadow-lg ring-2 ring-blue-500 border border-blue-200 dark:border-blue-700"
                : "bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md border border-transparent"
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onChange(provider.serviceID)}
            disabled={isSubmitting}
          >
            <div className={`rounded-full h-14 w-14 flex items-center justify-center mb-2 transition-all ${
              selectedProvider === provider.serviceID
                ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "bg-gray-100 dark:bg-gray-600"
            }`}>
              <img
                src={getProviderImage(provider.serviceID)}
                alt={provider.serviceID}
                className="h-8 w-8 object-contain"
              />
            </div>
            <span className={`text-sm font-medium transition-colors ${
              selectedProvider === provider.serviceID
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300"
            }`}>
              {getProviderName(provider.serviceID)}
            </span>
            {selectedProvider === provider.serviceID && (
              <div className="mt-1">
                <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
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