import PropTypes from 'prop-types';
import mtn from '../../../../assets/mtn.svg';
import glo from '../../../../assets/glo.svg';
import airtel from '../../../../assets/airtel.svg';
import nineMobile from '../../../../assets/9mobile.svg';

const NetworkProviderSelector = ({ providers, selectedProvider, onChange, isSubmitting }) => {
  const getProviderImage = (serviceID) => {
    switch(serviceID) {
      case 'mtn-data': return mtn;
      case 'glo-data': return glo;
      case 'airtel-data': return airtel;
      case 'etisalat-data': return nineMobile;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-[#6d7a98] dark:text-gray-300 mb-2">Select Network Provider</label>
      <div className="flex justify-evenly flex-wrap gap-4 border border-solid border-gray-300 rounded-lg p-3 dark:border-gray-600">
        {providers?.map((provider) => (
          <button
            key={provider.serviceID}
            type="button"
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              selectedProvider === provider.serviceID
                ? "bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => onChange(provider.serviceID)}
            disabled={isSubmitting}
          >
            <div className={`rounded-full h-12 w-12 flex items-center justify-center ${
              selectedProvider === provider.serviceID ? "ring-2 ring-blue-500" : ""
            }`}>
              <img
                src={provider.image}
                alt={provider.serviceID}
                className="h-8 w-8 object-contain"
              />
            </div>
            <span className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {provider.serviceID.split('-')[0].toUpperCase()}
            </span>
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