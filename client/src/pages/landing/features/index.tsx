import React, { useState } from "react";
import Navbar from "../navbar";
import Footer from "../footer";
import {
  FaMobileAlt,
  FaWifi,
  FaTv,
  FaBolt,
  FaWallet,
  FaGamepad,
  FaTrophy,
  FaGift,
  FaShieldAlt,
  FaRocket,
  FaUsers,
  FaChartLine,
  FaHeadset,
  FaCreditCard,
  FaLock,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaPlay,
  FaCrown,
  FaFire,
  FaCoins,
  FaCalculator,
  FaGlobe,
  FaClock,
  FaThumbsUp,
  FaAward,
  FaHandshake
} from "react-icons/fa";

const FeaturesPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const featureCategories = [
    { id: 'all', name: 'All Features', icon: <FaRocket className="text-blue-600" /> },
    { id: 'payments', name: 'Payments', icon: <FaCreditCard className="text-green-600" /> },
    { id: 'gaming', name: 'Gaming', icon: <FaGamepad className="text-purple-600" /> },
    { id: 'rewards', name: 'Rewards', icon: <FaGift className="text-yellow-600" /> },
    { id: 'security', name: 'Security', icon: <FaShieldAlt className="text-red-600" /> },
    { id: 'support', name: 'Support', icon: <FaHeadset className="text-blue-600" /> }
  ];

  const allFeatures = [
    // Payment Features
    {
      id: 1,
      category: 'payments',
      title: 'Instant Airtime Recharge',
      description: 'Recharge your mobile phone instantly across all Nigerian networks - MTN, Airtel, Glo, and 9mobile.',
      icon: <FaMobileAlt className="text-blue-600 text-3xl" />,
      benefits: ['Instant delivery', 'All networks supported', 'Best rates guaranteed', '24/7 availability'],
      popular: true
    },
    {
      id: 2,
      category: 'payments',
      title: 'High-Speed Data Bundles',
      description: 'Purchase data bundles for seamless internet connectivity with instant activation.',
      icon: <FaWifi className="text-green-600 text-3xl" />,
      benefits: ['Instant activation', 'All data plans', 'Auto-renewal options', 'Usage tracking'],
      popular: true
    },
    {
      id: 3,
      category: 'payments',
      title: 'Cable TV Subscriptions',
      description: 'Subscribe to DSTV, GOTV, and other cable services with instant activation.',
      icon: <FaTv className="text-purple-600 text-3xl" />,
      benefits: ['Instant activation', 'All cable providers', 'Flexible packages', 'Easy management'],
      popular: false
    },
    {
      id: 4,
      category: 'payments',
      title: 'Electricity Bill Payments',
      description: 'Pay your electricity bills instantly and get your token immediately.',
      icon: <FaBolt className="text-yellow-600 text-3xl" />,
      benefits: ['Instant token delivery', 'All distribution companies', 'Payment confirmation', 'Bill history'],
      popular: false
    },

    // Gaming Features
    {
      id: 5,
      category: 'gaming',
      title: 'Dice Rolling Games',
      description: 'Exciting dice games with real money prizes and fair play mechanics.',
      icon: <FaGamepad className="text-purple-600 text-3xl" />,
      benefits: ['Provably fair games', 'Real money prizes', 'Multiple bet options', 'Live results'],
      popular: true
    },
    {
      id: 6,
      category: 'gaming',
      title: 'Leaderboards & Rankings',
      description: 'Compete with other players and climb the rankings for exclusive rewards.',
      icon: <FaTrophy className="text-yellow-600 text-3xl" />,
      benefits: ['Daily rankings', 'Weekly competitions', 'Monthly tournaments', 'Achievement badges'],
      popular: false
    },
    {
      id: 7,
      category: 'gaming',
      title: 'Live Gaming Stats',
      description: 'Track your gaming performance with detailed statistics and analytics.',
      icon: <FaChartLine className="text-blue-600 text-3xl" />,
      benefits: ['Win/loss ratio', 'Profit tracking', 'Game history', 'Performance insights'],
      popular: false
    },

    // Wallet Features
    {
      id: 8,
      category: 'payments',
      title: 'Secure Digital Wallet',
      description: 'Manage your funds securely with instant deposits and withdrawals.',
      icon: <FaWallet className="text-green-600 text-3xl" />,
      benefits: ['Instant deposits', 'Secure withdrawals', 'Transaction history', 'Balance tracking'],
      popular: true
    },
    {
      id: 9,
      category: 'payments',
      title: 'Multiple Payment Methods',
      description: 'Pay with cards, bank transfers, or wallet balance for maximum convenience.',
      icon: <FaCreditCard className="text-blue-600 text-3xl" />,
      benefits: ['Credit/Debit cards', 'Bank transfers', 'Wallet balance', 'Auto-save cards'],
      popular: false
    },

    // Rewards Features
    {
      id: 10,
      category: 'rewards',
      title: 'Points Reward System',
      description: 'Earn points for every transaction and unlock exclusive rewards and discounts.',
      icon: <FaCoins className="text-yellow-600 text-3xl" />,
      benefits: ['Points per transaction', 'Referral bonuses', 'Daily login rewards', 'Tier benefits'],
      popular: true
    },
    {
      id: 11,
      category: 'rewards',
      title: 'Loyalty Tiers',
      description: 'Progress through Bronze, Silver, Gold, and Platinum tiers for better rewards.',
      icon: <FaCrown className="text-purple-600 text-3xl" />,
      benefits: ['Tier progression', 'Exclusive perks', 'Higher redemption rates', 'VIP benefits'],
      popular: false
    },
    {
      id: 12,
      category: 'rewards',
      title: 'Cash Back & Discounts',
      description: 'Redeem points for cash back, service discounts, and exclusive offers.',
      icon: <FaGift className="text-red-600 text-3xl" />,
      benefits: ['Cash back options', 'Service discounts', 'Exclusive offers', 'Flexible redemption'],
      popular: false
    },

    // Security Features
    {
      id: 13,
      category: 'security',
      title: 'Bank-Level Security',
      description: 'Enterprise-grade security with SSL encryption and advanced fraud protection.',
      icon: <FaShieldAlt className="text-green-600 text-3xl" />,
      benefits: ['256-bit SSL encryption', 'Fraud monitoring', 'Secure authentication', 'Data protection'],
      popular: true
    },
    {
      id: 14,
      category: 'security',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security with 2FA for all your transactions.',
      icon: <FaLock className="text-blue-600 text-3xl" />,
      benefits: ['SMS verification', 'Authenticator apps', 'Biometric options', 'Security alerts'],
      popular: false
    },
    {
      id: 15,
      category: 'security',
      title: 'Transaction Monitoring',
      description: 'Real-time monitoring of all transactions with instant notifications.',
      icon: <FaChartLine className="text-purple-600 text-3xl" />,
      benefits: ['Real-time alerts', 'Transaction logs', 'Suspicious activity detection', 'Account security'],
      popular: false
    },

    // Support Features
    {
      id: 16,
      category: 'support',
      title: '24/7 Customer Support',
      description: 'Get help anytime with our dedicated support team available around the clock.',
      icon: <FaHeadset className="text-blue-600 text-3xl" />,
      benefits: ['24/7 availability', 'Multiple channels', 'Quick response times', 'Expert assistance'],
      popular: true
    },
    {
      id: 17,
      category: 'support',
      title: 'Live Chat Support',
      description: 'Chat with our support agents in real-time for instant assistance.',
      icon: <FaUsers className="text-green-600 text-3xl" />,
      benefits: ['Real-time chat', 'Instant responses', 'Screen sharing', 'File attachments'],
      popular: false
    },
    {
      id: 18,
      category: 'support',
      title: 'Help Center & FAQ',
      description: 'Comprehensive help center with guides, tutorials, and frequently asked questions.',
      icon: <FaGlobe className="text-purple-600 text-3xl" />,
      benefits: ['Video tutorials', 'Step-by-step guides', 'Search functionality', 'Community forum'],
      popular: false
    }
  ];

  const filteredFeatures = activeCategory === 'all'
    ? allFeatures
    : allFeatures.filter(feature => feature.category === activeCategory);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Powerful Features for Every Need
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover all the tools and features that make OhTopUp the ultimate utility payment and gaming platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
                <FaRocket className="mr-2" />
                Get Started Now
              </a>
              <button onClick={() => document.getElementById('features-grid')?.scrollIntoView({ behavior: 'smooth' })} className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors">
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center space-x-1 md:space-x-4 py-4">
            {featureCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                  {category.id === 'all' ? allFeatures.length : allFeatures.filter(f => f.category === category.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features-grid" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {featureCategories.find(cat => cat.id === activeCategory)?.name || 'All Features'}
            </h2>
            <p className="text-xl text-gray-600">
              {activeCategory === 'all'
                ? 'Explore our comprehensive suite of features designed to enhance your experience'
                : `Discover all the ${featureCategories.find(cat => cat.id === activeCategory)?.name.toLowerCase()} features we offer`
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFeatures.map((feature) => (
              <div key={feature.id} className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative ${feature.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {feature.popular && (
                  <div className="absolute -top-3 left-6 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Popular
                  </div>
                )}

                <div className="flex items-center mb-4">
                  <div className="mr-4">{feature.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{feature.title}</h3>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      feature.category === 'payments' ? 'bg-green-100 text-green-800' :
                      feature.category === 'gaming' ? 'bg-purple-100 text-purple-800' :
                      feature.category === 'rewards' ? 'bg-yellow-100 text-yellow-800' :
                      feature.category === 'security' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {featureCategories.find(cat => cat.id === feature.category)?.name}
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{feature.description}</p>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Learn More
                </button>
              </div>
            ))}
          </div>

          {filteredFeatures.length === 0 && (
            <div className="text-center py-20">
              <div className="text-gray-500 mb-4">No features found in this category</div>
              <button
                onClick={() => setActiveCategory('all')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                View All Features
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose OhTopUp?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the difference with our innovative features and user-centric design
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaRocket className="text-blue-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Instant service delivery and real-time processing</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-green-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">Bank-grade security with 99.9% uptime guarantee</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-purple-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">User-Friendly</h3>
              <p className="text-gray-600">Intuitive interface designed for the best user experience</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaAward className="text-yellow-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Award Winning</h3>
              <p className="text-gray-600">Recognized for excellence in fintech innovation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl opacity-90">
              Join our growing community of satisfied users
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-200">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">₦50M+</div>
              <div className="text-blue-200">Transactions Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-200">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-200">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Experience All These Features?
          </h2>
          <p className="text-xl mb-8 text-gray-600">
            Join OhTopUp today and unlock the full potential of our comprehensive platform
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
              <FaRocket className="mr-2" />
              Get Started Free
            </a>
            <a href="/login" className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors">
              Login to Account
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <FaThumbsUp className="text-3xl mx-auto mb-2 text-green-600" />
              <p className="font-semibold text-gray-900">Easy to Use</p>
              <p className="text-sm text-gray-600">Simple interface for everyone</p>
            </div>
            <div>
              <FaClock className="text-3xl mx-auto mb-2 text-blue-600" />
              <p className="font-semibold text-gray-900">Save Time</p>
              <p className="text-sm text-gray-600">Complete transactions in seconds</p>
            </div>
            <div>
              <FaHandshake className="text-3xl mx-auto mb-2 text-purple-600" />
              <p className="font-semibold text-gray-900">Trusted Platform</p>
              <p className="text-sm text-gray-600">Millions of successful transactions</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default FeaturesPage;