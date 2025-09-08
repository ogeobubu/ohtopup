
import React, { useEffect, useState } from "react";
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { joinWaitlist } from "../../api";
import ohtopupLogo from "../../assets/logo/ohtopup-high-resolution-logo.png";
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
  FaCoins
} from "react-icons/fa";

const LandingPage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Small Business Owner",
      content: "OhTopUp has revolutionized how I handle my utility payments. Everything is so seamless!",
      rating: 5
    },
    {
      name: "Michael Adebayo",
      role: "Tech Entrepreneur",
      content: "The dice game feature is addictive! Plus the utility payments are lightning fast.",
      rating: 5
    },
    {
      name: "Grace Okafor",
      role: "Freelancer",
      content: "Best platform for managing all my subscriptions. The referral system is a game changer!",
      rating: 5
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const mutation = useMutation({
    mutationFn: joinWaitlist,
    onSuccess: () => {
      toast.success("Successfully subscribed to our newsletter!");
      formik.resetForm();
    },
    onError: (error) => {
      console.error("Error subscribing:", error);
      toast.error("Error subscribing. Please try again.");
    },
  });

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src={ohtopupLogo}
                alt="OhTopUp Logo"
                className="h-10 w-auto"
              />
            </div>
            <div className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-blue-600 transition-colors">Features</button>
              <button onClick={() => scrollToSection('services')} className="text-gray-700 hover:text-blue-600 transition-colors">Services</button>
              <button onClick={() => scrollToSection('gaming')} className="text-gray-700 hover:text-blue-600 transition-colors">Gaming</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-gray-700 hover:text-blue-600 transition-colors">Reviews</button>
            </div>
            <div className="flex space-x-4">
              <a href="/login" className="text-gray-700 hover:text-blue-600 transition-colors">Login</a>
              <a href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Get Started</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Nigeria's #1 Utility Payment & Gaming Platform
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Pay bills, buy airtime & data, subscribe to TV, play games, and earn rewards - all in one place!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
                <FaRocket className="mr-2" />
                Start Using OhTopUp
              </a>
              <button onClick={() => scrollToSection('features')} className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive utility management with gaming and rewards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Utility Payments */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center mb-4">
                <FaBolt className="text-green-600 text-2xl mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Utility Payments</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Pay electricity bills, subscribe to DSTV/GOTV, and manage all your utilities instantly.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" />Electricity bill payments</li>
                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" />Cable TV subscriptions</li>
                <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" />Instant confirmations</li>
              </ul>
            </div>

            {/* Airtime & Data */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center mb-4">
                <FaMobileAlt className="text-blue-600 text-2xl mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Airtime & Data</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Recharge your phone and buy data bundles for all Nigerian networks with instant delivery.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><FaCheckCircle className="text-blue-500 mr-2" />All networks supported</li>
                <li className="flex items-center"><FaCheckCircle className="text-blue-500 mr-2" />Instant delivery</li>
                <li className="flex items-center"><FaCheckCircle className="text-blue-500 mr-2" />Best rates guaranteed</li>
              </ul>
            </div>

            {/* Gaming & Entertainment */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center mb-4">
                <FaGamepad className="text-purple-600 text-2xl mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Gaming & Fun</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Play exciting dice games, compete on leaderboards, and win amazing prizes.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><FaCheckCircle className="text-purple-500 mr-2" />Dice rolling games</li>
                <li className="flex items-center"><FaCheckCircle className="text-purple-500 mr-2" />Leaderboard competitions</li>
                <li className="flex items-center"><FaCheckCircle className="text-purple-500 mr-2" />Real money prizes</li>
              </ul>
            </div>

            {/* Wallet & Banking */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-xl border border-yellow-200">
              <div className="flex items-center mb-4">
                <FaWallet className="text-yellow-600 text-2xl mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Digital Wallet</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Secure wallet system with instant deposits, withdrawals, and transaction tracking.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><FaCheckCircle className="text-yellow-500 mr-2" />Instant deposits</li>
                <li className="flex items-center"><FaCheckCircle className="text-yellow-500 mr-2" />Secure withdrawals</li>
                <li className="flex items-center"><FaCheckCircle className="text-yellow-500 mr-2" />Transaction history</li>
              </ul>
            </div>

            {/* Rewards & Referrals */}
            <div className="bg-gradient-to-br from-red-50 to-pink-100 p-6 rounded-xl border border-red-200">
              <div className="flex items-center mb-4">
                <FaGift className="text-red-600 text-2xl mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Rewards Program</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Earn points, get discounts, and enjoy exclusive rewards for being active on the platform.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><FaCheckCircle className="text-red-500 mr-2" />Referral bonuses</li>
                <li className="flex items-center"><FaCheckCircle className="text-red-500 mr-2" />Loyalty rewards</li>
                <li className="flex items-center"><FaCheckCircle className="text-red-500 mr-2" />Exclusive discounts</li>
              </ul>
            </div>

            {/* Rankings & Competition */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-6 rounded-xl border border-indigo-200">
              <div className="flex items-center mb-4">
                <FaTrophy className="text-indigo-600 text-2xl mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Leaderboards</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Compete with other users, climb the rankings, and unlock special achievements.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><FaCheckCircle className="text-indigo-500 mr-2" />Weekly rankings</li>
                <li className="flex items-center"><FaCheckCircle className="text-indigo-500 mr-2" />Monthly competitions</li>
                <li className="flex items-center"><FaCheckCircle className="text-indigo-500 mr-2" />Achievement badges</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Utility Services
            </h2>
            <p className="text-xl text-gray-600">
              All your essential services in one convenient platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaMobileAlt className="text-blue-600 text-3xl mb-4" />
              <h3 className="text-lg font-semibold mb-2">Airtime Recharge</h3>
              <p className="text-gray-600 text-sm">Instant airtime for MTN, Airtel, Glo, 9mobile</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaWifi className="text-green-600 text-3xl mb-4" />
              <h3 className="text-lg font-semibold mb-2">Data Bundles</h3>
              <p className="text-gray-600 text-sm">High-speed internet data for all networks</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaTv className="text-purple-600 text-3xl mb-4" />
              <h3 className="text-lg font-semibold mb-2">Cable TV</h3>
              <p className="text-gray-600 text-sm">DSTV, GOTV, and other cable subscriptions</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaBolt className="text-yellow-600 text-3xl mb-4" />
              <h3 className="text-lg font-semibold mb-2">Electricity</h3>
              <p className="text-gray-600 text-sm">Prepaid electricity bill payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gaming Section */}
      <section id="gaming" className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🎮 Gaming & Entertainment
            </h2>
            <p className="text-xl opacity-90">
              Play, compete, and win real prizes while enjoying your favorite games
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <FaGamepad className="text-6xl mx-auto mb-4 text-yellow-300" />
              <h3 className="text-2xl font-bold mb-2">Dice Games</h3>
              <p className="opacity-90">Exciting dice rolling games with real money prizes</p>
            </div>

            <div className="text-center">
              <FaTrophy className="text-6xl mx-auto mb-4 text-yellow-300" />
              <h3 className="text-2xl font-bold mb-2">Leaderboards</h3>
              <p className="opacity-90">Compete with players nationwide and climb the ranks</p>
            </div>

            <div className="text-center">
              <FaCoins className="text-6xl mx-auto mb-4 text-yellow-300" />
              <h3 className="text-2xl font-bold mb-2">Real Rewards</h3>
              <p className="opacity-90">Win cash prizes, discounts, and exclusive bonuses</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🔒 Bank-Level Security
            </h2>
            <p className="text-xl text-gray-600">
              Your money and data are protected with enterprise-grade security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <FaShieldAlt className="text-5xl mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">SSL Encryption</h3>
              <p className="text-gray-600">256-bit SSL encryption for all transactions</p>
            </div>

            <div className="text-center">
              <FaLock className="text-5xl mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">Paystack-powered secure payment processing</p>
            </div>

            <div className="text-center">
              <FaHeadset className="text-5xl mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied customers
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="flex mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <FaStar key={i} className="text-yellow-400" />
                ))}
              </div>
              <p className="text-lg text-gray-700 mb-6 italic">
                "{testimonials[currentTestimonial].content}"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  {testimonials[currentTestimonial].name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</h4>
                  <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience the Future of Utility Payments?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have simplified their utility management with OhTopUp
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
              <FaRocket className="mr-2" />
              Get Started Free
            </a>
            <a href="/login" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors">
              Login to Account
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <FaCheckCircle className="text-3xl mx-auto mb-2 text-green-300" />
              <p className="font-semibold">Free Registration</p>
            </div>
            <div>
              <FaCheckCircle className="text-3xl mx-auto mb-2 text-green-300" />
              <p className="font-semibold">Instant Services</p>
            </div>
            <div>
              <FaCheckCircle className="text-3xl mx-auto mb-2 text-green-300" />
              <p className="font-semibold">24/7 Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl mb-8 opacity-90">
            Get the latest updates, new features, and exclusive offers
          </p>

          <form onSubmit={formik.handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email address"
                {...formik.getFieldProps('email')}
                className={`flex-1 px-4 py-3 rounded-lg text-gray-900 ${
                  formik.touched.email && formik.errors.email ? 'border-red-500' : ''
                }`}
              />
              <button
                type="submit"
                disabled={mutation.isPending || !formik.isValid || !formik.dirty}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {mutation.isPending ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-400 mt-2 text-sm">{formik.errors.email}</p>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <img
                  src={ohtopupLogo}
                  alt="OhTopUp Logo"
                  className="h-8 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-gray-400">
                Nigeria's leading utility payment and gaming platform. Making life easier, one transaction at a time.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Airtime & Data</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cable TV</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Electricity</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gaming</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/support" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaUsers className="text-xl" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaChartLine className="text-xl" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaHeadset className="text-xl" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 OhTopUp. All rights reserved. | Made with ❤️ for Nigeria</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;