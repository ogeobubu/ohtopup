import PropTypes from 'prop-types';
import { FaLightbulb, FaMobileAlt, FaWifi, FaBolt, FaRocket } from 'react-icons/fa';

const AIRecommendations = ({ transactions = [], walletBalance = 0 }) => {
  // Simple AI logic based on transaction history
  const generateRecommendations = () => {
    const recommendations = [];

    if (!transactions || transactions.length === 0) {
      return [
        {
          id: 1,
          type: 'welcome',
          title: 'Welcome to OhTopUp!',
          description: 'Start your first transaction to get personalized recommendations',
          icon: <FaRocket className="text-blue-600 text-xl" />,
          action: 'Make your first purchase',
          actionUrl: '/utilities'
        }
      ];
    }

    // Analyze transaction patterns
    const airtimeCount = transactions.filter(t => t.type === 'airtime').length;
    const dataCount = transactions.filter(t => t.type === 'data').length;
    const cableCount = transactions.filter(t => t.type === 'cable').length;
    const electricityCount = transactions.filter(t => t.type === 'electricity').length;

    const totalTransactions = transactions.length;
    const avgAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / totalTransactions;

    // Recommendation 1: Based on most used service
    if (airtimeCount > dataCount && airtimeCount > cableCount) {
      recommendations.push({
        id: 2,
        type: 'airtime',
        title: 'Airtime Enthusiast',
        description: `You've purchased airtime ${airtimeCount} times. Consider our data bundles for better value!`,
        icon: <FaMobileAlt className="text-green-600 text-xl" />,
        action: 'Browse Data Plans',
        actionUrl: '/utilities/data'
      });
    } else if (dataCount > airtimeCount && dataCount > cableCount) {
      recommendations.push({
        id: 3,
        type: 'data',
        title: 'Data Power User',
        description: `You've purchased data ${dataCount} times. Try our cable TV subscriptions for entertainment!`,
        icon: <FaWifi className="text-blue-600 text-xl" />,
        action: 'Explore Cable TV',
        actionUrl: '/utilities/cable'
      });
    }

    // Recommendation 2: Based on spending patterns
    if (avgAmount < 1000) {
      recommendations.push({
        id: 4,
        type: 'savings',
        title: 'Smart Saver',
        description: 'Your average transaction is under ₦1,000. Consider bulk purchases for better rates!',
        icon: <FaLightbulb className="text-yellow-600 text-xl" />,
        action: 'View Bulk Options',
        actionUrl: '/utilities'
      });
    }

    // Recommendation 3: Based on wallet balance
    if (walletBalance > 5000) {
      recommendations.push({
        id: 5,
        type: 'balance',
        title: 'High Balance Alert',
        description: 'You have ₦5,000+ in your wallet. Consider making a larger purchase!',
        icon: <FaBolt className="text-purple-600 text-xl" />,
        action: 'Make a Purchase',
        actionUrl: '/utilities'
      });
    }

    // Recommendation 4: Cross-selling
    if (electricityCount === 0) {
      recommendations.push({
        id: 6,
        type: 'cross-sell',
        title: 'Try Electricity Bills',
        description: 'Pay your electricity bills instantly with our secure platform',
        icon: <FaBolt className="text-orange-600 text-xl" />,
        action: 'Pay Electricity',
        actionUrl: '/utilities/electricity'
      });
    }

    // If no specific recommendations, show general ones
    if (recommendations.length === 0) {
      recommendations.push({
        id: 7,
        type: 'general',
        title: 'Explore Our Services',
        description: 'Discover airtime, data, cable TV, and electricity payment options',
        icon: <FaRocket className="text-blue-600 text-xl" />,
        action: 'Browse Services',
        actionUrl: '/utilities'
      });
    }

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  };

  const recommendations = generateRecommendations();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          AI Recommendations
        </h2>
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <FaLightbulb className="text-purple-600 dark:text-purple-400 text-sm" />
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="flex-shrink-0">
              {rec.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {rec.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {rec.description}
              </p>
              <a
                href={rec.actionUrl}
                className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {rec.action}
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 These recommendations are personalized based on your usage patterns
        </p>
      </div>
    </div>
  );
};

AIRecommendations.propTypes = {
  transactions: PropTypes.array,
  walletBalance: PropTypes.number
};

export default AIRecommendations;