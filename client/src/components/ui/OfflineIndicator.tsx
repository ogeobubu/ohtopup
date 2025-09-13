import { FaWifi, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

const OfflineIndicator = () => {
  const { isOnline, queue, isProcessing, processQueue, queueLength } = useOfflineQueue();

  if (isOnline && queueLength === 0) {
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

        {queueLength > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
            <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {queueLength} queued
            </span>
            {isOnline && !isProcessing && (
              <button
                onClick={processQueue}
                className="ml-2 p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                title="Sync queued transactions"
              >
                <FaSync className="text-xs" />
              </button>
            )}
            {isProcessing && (
              <FaSync className="text-blue-500 animate-spin text-sm" />
            )}
          </div>
        )}
      </div>

      {queueLength > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Queued Transactions:
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {queue.slice(0, 3).map((item) => (
              <div key={item.id} className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded">
                <div className="font-medium capitalize">{item.type}</div>
                <div className="text-gray-500 dark:text-gray-400">
                  ₦{item.amount} - {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {queueLength > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{queueLength - 3} more...
              </div>
            )}
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            💡 Transactions will be queued and synced when you're back online
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;