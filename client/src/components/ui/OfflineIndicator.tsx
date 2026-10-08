import { FaWifi } from 'react-icons/fa';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

const OfflineIndicator = () => {
  const { isOnline } = useOfflineQueue();

  if (isOnline) {
    return null; // Don't show anything when online and no queued items
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline
        ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
        : 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
    }`}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <FaWifi className="text-green-600 dark:text-green-400" />
          ) : (
            <div className="relative">
              <FaWifi className="text-red-600 dark:text-red-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-red-600 dark:bg-red-400 transform rotate-45"></div>
              </div>
            </div>
          )}
          <span className={`text-sm font-medium ${
            isOnline
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

      </div>

      {!isOnline && (
        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Reconnect before making a payment. Transactions are never queued offline.
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
