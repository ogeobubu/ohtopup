import React, { useState } from "react";
import Navbar from "../navbar";
import Footer from "../footer";
import {
  FaGift,
  FaCoins,
  FaTrophy,
  FaUsers,
  FaStar,
  FaRocket,
  FaCrown,
  FaFire,
  FaCheckCircle,
  FaArrowRight,
  FaCalculator,
  FaChartLine,
  FaShieldAlt
} from "react-icons/fa";

const RewardsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const rewardTiers = [
    {
      name: "Bronze",
      icon: <FaCoins className="text-yellow-600 text-2xl" />,
      points: "0 - 999",
      benefits: ["Basic rewards", "Referral bonus: ₦50", "Monthly newsletter"],
      color: "from-yellow-400 to-yellow-600"
    },
    {
      name: "Silver",
      icon: <FaStar className="text-gray-400 text-2xl" />,
      points: "1,000 - 4,999",
      benefits: ["All Bronze benefits", "Referral bonus: ₦100", "Priority support", "Exclusive discounts"],
      color: "from-gray-300 to-gray-500"
    },
    {
      name: "Gold",
      icon: <FaTrophy className="text-yellow-500 text-2xl" />,
      points: "5,000 - 14,999",
      benefits: ["All Silver benefits", "Referral bonus: ₦200", "VIP customer service", "Free transactions", "Birthday bonus"],
      color: "from-yellow-400 to-yellow-600"
    },
    {
      name: "Platinum",
      icon: <FaCrown className="text-purple-600 text-2xl" />,
      points: "15,000+",
      benefits: ["All Gold benefits", "Referral bonus: ₦500", "Dedicated account manager", "Custom rewards", "Exclusive events"],
      color: "from-purple-400 to-purple-600"
    }
  ];

  const earningMethods = [
    {
      title: "Complete Transactions",
      description: "Earn points for every utility payment and service purchase",
      points: "10 points per transaction",
      icon: <FaRocket className="text-blue-600 text-2xl" />,
      examples: ["Airtime recharge: 10 points", "Data purchase: 10 points", "Electricity bill: 10 points"]
    },
    {
      title: "Refer Friends",
      description: "Invite friends and earn bonus points when they join and transact",
      points: "Up to 500 points per referral",
      icon: <FaUsers className="text-green-600 text-2xl" />,
      examples: ["Friend signs up: 25 points", "Friend's first transaction: 50 points", "Friend reaches Gold tier: 100 points"]
    },
    {
      title: "Daily Login Bonus",
      description: "Stay active and earn points just for logging in daily",
      points: "5 points per day",
      icon: <FaFire className="text-orange-600 text-2xl" />,
      examples: ["Daily login streak: 5 points", "7-day streak bonus: 50 points", "30-day streak bonus: 200 points"]
    },
    {
      title: "Achievements & Milestones",
      description: "Unlock special rewards by reaching important milestones",
      points: "50 - 500 points",
      icon: <FaTrophy className="text-purple-600 text-2xl" />,
      examples: ["First transaction: 50 points", "50 transactions: 100 points", "1000 points earned: 200 points"]
    }
  ];

  const redemptionOptions = [
    {
      title: "Cash Back",
      description: "Convert points directly to cash in your wallet",
      rate: "100 points = ₦50",
      icon: <FaCoins className="text-green-600 text-2xl" />,
      popular: true
    },
    {
      title: "Discount Vouchers",
      description: "Get percentage discounts on future purchases",
      rate: "200 points = 10% off",
      icon: <FaGift className="text-blue-600 text-2xl" />,
      popular: false
    },
    {
      title: "Free Services",
      description: "Redeem points for free utility services",
      rate: "500 points = Free airtime",
      icon: <FaRocket className="text-purple-600 text-2xl" />,
      popular: false
    },
    {
      title: "Exclusive Perks",
      description: "Access to premium features and early releases",
      rate: "1000 points = Premium access",
      icon: <FaCrown className="text-yellow-600 text-2xl" />,
      popular: false
    }
  ];

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              🎁 OhTopUp Rewards Program
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Earn points, unlock tiers, and get amazing rewards for using our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
                <FaRocket className="mr-2" />
                Start Earning Points
              </a>
              <button onClick={() => setActiveTab('calculator')} className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-purple-600 transition-colors">
                Calculate Earnings
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center space-x-1 md:space-x-8 py-4">
            {[
              { id: 'overview', label: 'Overview', icon: FaChartLine },
              { id: 'tiers', label: 'Reward Tiers', icon: FaTrophy },
              { id: 'earning', label: 'How to Earn', icon: FaCoins },
              { id: 'redemption', label: 'Redemption', icon: FaGift },
              { id: 'calculator', label: 'Points Calculator', icon: FaCalculator }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <tab.icon className="text-sm" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-16">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Welcome to OhTopUp Rewards
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Our comprehensive rewards program is designed to reward you for every interaction with our platform.
                  From simple transactions to referrals and achievements, there's always a way to earn more points and unlock greater benefits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                  <FaCoins className="text-4xl text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Earn Points</h3>
                  <p className="text-gray-600">Points for transactions, referrals, and daily activity</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                  <FaTrophy className="text-4xl text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Unlock Tiers</h3>
                  <p className="text-gray-600">Progress through Bronze, Silver, Gold, and Platinum tiers</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                  <FaGift className="text-4xl text-purple-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Redeem Rewards</h3>
                  <p className="text-gray-600">Convert points to cash, discounts, and exclusive perks</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">🎯 Quick Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <div className="text-3xl font-bold">10 pts</div>
                      <div className="text-sm opacity-90">Per Transaction</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">500 pts</div>
                      <div className="text-sm opacity-90">Max Referral Bonus</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">₦50</div>
                      <div className="text-sm opacity-90">Cash Back Rate</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">24/7</div>
                      <div className="text-sm opacity-90">Support Available</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reward Tiers Tab */}
          {activeTab === 'tiers' && (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Reward Tiers & Benefits
                </h2>
                <p className="text-xl text-gray-600">
                  Unlock higher tiers as you earn more points and enjoy exclusive benefits
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {rewardTiers.map((tier, index) => (
                  <div key={tier.name} className={`bg-gradient-to-br ${tier.color} text-white p-6 rounded-xl shadow-lg relative`}>
                    {index === 3 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <FaCrown className="text-yellow-400 text-2xl" />
                      </div>
                    )}
                    <div className="text-center mb-4">
                      {tier.icon}
                      <h3 className="text-xl font-bold mt-2">{tier.name}</h3>
                      <p className="text-sm opacity-90">{tier.points} points</p>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center">
                          <FaCheckCircle className="text-green-300 mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-center mb-6">How Tier Progression Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCoins className="text-blue-600 text-2xl" />
                    </div>
                    <h4 className="font-semibold mb-2">Earn Points</h4>
                    <p className="text-gray-600 text-sm">Complete transactions and activities to accumulate points</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaArrowRight className="text-green-600 text-2xl" />
                    </div>
                    <h4 className="font-semibold mb-2">Reach Milestones</h4>
                    <p className="text-gray-600 text-sm">Hit point thresholds to unlock higher reward tiers</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaTrophy className="text-purple-600 text-2xl" />
                    </div>
                    <h4 className="font-semibold mb-2">Enjoy Benefits</h4>
                    <p className="text-gray-600 text-sm">Access exclusive perks and higher reward rates</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Earning Methods Tab */}
          {activeTab === 'earning' && (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  How to Earn Points
                </h2>
                <p className="text-xl text-gray-600">
                  Multiple ways to earn points and climb the reward tiers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {earningMethods.map((method, index) => (
                  <div key={method.title} className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-start mb-4">
                      <div className="mr-4">{method.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{method.title}</h3>
                        <p className="text-gray-600 mb-3">{method.description}</p>
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <p className="font-semibold text-blue-800">{method.points}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Examples:</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {method.examples.map((example, i) => (
                          <li key={i} className="flex items-center">
                            <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-center mb-6">💡 Pro Tips to Earn More Points</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Daily Habits</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Login daily for streak bonuses</li>
                      <li>• Complete at least one transaction daily</li>
                      <li>• Check for daily challenges</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Smart Strategies</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Refer friends who are active users</li>
                      <li>• Time purchases for bonus periods</li>
                      <li>• Participate in special events</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Redemption Tab */}
          {activeTab === 'redemption' && (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Redeem Your Points
                </h2>
                <p className="text-xl text-gray-600">
                  Convert your hard-earned points into valuable rewards
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {redemptionOptions.map((option, index) => (
                  <div key={option.title} className={`bg-white p-6 rounded-xl shadow-lg relative ${option.popular ? 'ring-2 ring-green-500' : ''}`}>
                    {option.popular && (
                      <div className="absolute -top-3 left-6 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    )}
                    <div className="flex items-start mb-4">
                      <div className="mr-4">{option.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{option.title}</h3>
                        <p className="text-gray-600 mb-3">{option.description}</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-semibold text-gray-800">{option.rate}</p>
                        </div>
                      </div>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      Redeem Points
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-center mb-6">Redemption Terms & Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <FaShieldAlt className="text-blue-600 mr-2" />
                      General Rules
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Minimum redemption: 100 points</li>
                      <li>• Points expire after 12 months of inactivity</li>
                      <li>• Redemptions are processed within 24 hours</li>
                      <li>• Some rewards may have additional requirements</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <FaCheckCircle className="text-green-600 mr-2" />
                      Redemption Process
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Select your desired reward</li>
                      <li>• Confirm point deduction</li>
                      <li>• Reward delivered to your account</li>
                      <li>• Email confirmation sent</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Points Calculator Tab */}
          {activeTab === 'calculator' && (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Points Calculator
                </h2>
                <p className="text-xl text-gray-600">
                  Estimate how many points you can earn with different activities
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4">Activity Calculator</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>Daily Transactions (10 pts each)</span>
                        <span className="font-semibold">50 pts/day</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>Weekly Referrals (25 pts each)</span>
                        <span className="font-semibold">175 pts/week</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>Monthly Login Streak</span>
                        <span className="font-semibold">150 pts/month</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>Achievement Bonuses</span>
                        <span className="font-semibold">200 pts/month</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-4">Monthly Earnings Estimate</h3>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">575 pts</div>
                        <p className="text-gray-600 mb-4">Estimated monthly points</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold">Cash Value</div>
                            <div className="text-green-600">₦287.50</div>
                          </div>
                          <div>
                            <div className="font-semibold">Next Tier</div>
                            <div className="text-purple-600">Gold (5,000 pts)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-xl">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">🎯 Maximize Your Earnings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <FaRocket className="text-4xl mx-auto mb-2 text-yellow-300" />
                      <h4 className="font-semibold mb-2">Stay Active</h4>
                      <p className="text-sm opacity-90">Regular transactions and daily logins</p>
                    </div>
                    <div>
                      <FaUsers className="text-4xl mx-auto mb-2 text-yellow-300" />
                      <h4 className="font-semibold mb-2">Refer Friends</h4>
                      <p className="text-sm opacity-90">Share with friends and family</p>
                    </div>
                    <div>
                      <FaTrophy className="text-4xl mx-auto mb-2 text-yellow-300" />
                      <h4 className="font-semibold mb-2">Hit Milestones</h4>
                      <p className="text-sm opacity-90">Unlock achievements and bonuses</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Earning Rewards?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who are already earning points and unlocking amazing rewards
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
              <FaRocket className="mr-2" />
              Join OhTopUp Now
            </a>
            <a href="/login" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors">
              Login to Dashboard
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <FaCoins className="text-3xl mx-auto mb-2 text-green-300" />
              <p className="font-semibold">Start Earning Today</p>
            </div>
            <div>
              <FaTrophy className="text-3xl mx-auto mb-2 text-yellow-300" />
              <p className="font-semibold">Unlock Higher Tiers</p>
            </div>
            <div>
              <FaGift className="text-3xl mx-auto mb-2 text-purple-300" />
              <p className="font-semibold">Redeem Amazing Rewards</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default RewardsPage;