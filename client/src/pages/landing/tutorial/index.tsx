import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navbar from "../navbar";
import Hero from "../hero";
import Partners from "../partners";
import Footer from "../footer";
import { getAllTutorials, getTutorialCategories } from "../../../api";
import {
  FaBook,
  FaWallet,
  FaGamepad,
  FaHeadset,
  FaCreditCard,
  FaUser,
  FaRocket,
  FaClock,
  FaPlay,
  FaStar,
  FaVideo,
  FaSearch
} from "react-icons/fa";

const TutorialPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('name');

  const {
    data: tutorialsData,
    error: tutorialsError,
    isLoading: tutorialsLoading,
  } = useQuery({
    queryKey: ["tutorials"],
    queryFn: getAllTutorials,
  });

  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["tutorialCategories"],
    queryFn: getTutorialCategories,
  });

  const tutorials = tutorialsData?.tutorials ?? [];
  const categories = categoriesData?.categories ?? [];
  const isLoading = tutorialsLoading || categoriesLoading;
  const error = tutorialsError || categoriesError;

  // Function to get appropriate icon for category
  const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
      case 'getting-started':
        return <FaRocket className="text-green-600" />;
      case 'payments':
        return <FaCreditCard className="text-purple-600" />;
      case 'gaming':
        return <FaGamepad className="text-yellow-600" />;
      case 'account':
        return <FaUser className="text-red-600" />;
      case 'support':
        return <FaHeadset className="text-blue-600" />;
      default:
        return <FaBook className="text-blue-600" />;
    }
  };

  // Function to get icon for tutorial based on category
  const getTutorialIcon = (category) => {
    switch (category) {
      case 'getting-started':
        return <FaRocket className="text-green-600 text-3xl" />;
      case 'payments':
        return <FaCreditCard className="text-purple-600 text-3xl" />;
      case 'gaming':
        return <FaGamepad className="text-yellow-600 text-3xl" />;
      case 'account':
        return <FaWallet className="text-green-600 text-3xl" />;
      case 'support':
        return <FaHeadset className="text-blue-600 text-3xl" />;
      default:
        return <FaBook className="text-blue-600 text-3xl" />;
    }
  };

  // Create category objects with icons
  const tutorialCategories = categories.map(category => ({
    ...category,
    icon: getCategoryIcon(category.id)
  }));

  // Filter and sort tutorials
  const filteredTutorials = useMemo(() => {
    const byCategory = activeCategory === 'all' ? tutorials : tutorials.filter(tutorial => tutorial.category === activeCategory);
    const bySearch = searchTerm
      ? byCategory.filter(tutorial =>
          tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tutorial.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : byCategory;
    const sorted = [...bySearch].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "duration") {
        // Simple duration comparison (assuming format like "5 min", "10 min", etc.)
        const aDuration = parseInt(a.duration) || 0;
        const bDuration = parseInt(b.duration) || 0;
        return aDuration - bDuration;
      }
      return 0;
    });
    return sorted;
  }, [tutorials, activeCategory, searchTerm, sort]);

  return (
    <>
      <Navbar />

      <Hero
        heading="Master OhTopUp with Our Tutorials"
        subheading="Step-by-step guides to help you make the most of our platform"
        buttonText="Get Started Now"
        secondButtonText="Browse Tutorials"
        href="/register"
      />

      <div className="container mx-auto py-20 px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-4 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-4 border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">
              Loading tutorials...
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Please wait while we fetch the latest content
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaBook className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Unable to load tutorials
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error.message || 'Something went wrong while fetching tutorials. Please try again.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className="text-center mb-6 md:mb-8 px-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">
                Master OhTopUp with Our Tutorials
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Step-by-step guides to help you make the most of our platform
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 md:p-4 mb-4 md:mb-6">
              <div className="flex flex-col gap-3 md:gap-4">
                {/* Search Bar */}
                <div className="relative w-full">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tutorials..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                    {/* Category Filter */}
                    <select
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value)}
                      className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm min-w-0"
                    >
                      <option value="all">All Categories</option>
                      {tutorialCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {/* Sort Filter */}
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm min-w-0"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="duration">Sort by Duration</option>
                    </select>
                  </div>

                  {/* Stats */}
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <span className="font-medium text-gray-900 dark:text-white">{filteredTutorials.length}</span> found
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {filteredTutorials.map((tutorial) => {
                const categoryIcon = getTutorialIcon(tutorial.category);

                return (
                  <div
                    key={tutorial.id || tutorial._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 md:p-4 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="text-lg md:text-xl">
                            {categoryIcon}
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            tutorial.difficulty === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            tutorial.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {tutorial.difficulty}
                          </span>
                        </div>
                        {tutorial.popular && (
                          <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded text-xs font-medium">
                            <FaStar className="text-xs" />
                            <span className="hidden sm:inline">Popular</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 md:p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base leading-tight">
                        {tutorial.title}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-300 mb-3 text-xs md:text-sm leading-relaxed line-clamp-2">
                        {tutorial.description}
                      </p>

                      <div className="flex items-center space-x-2 md:space-x-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <FaClock className="text-xs" />
                          <span>{tutorial.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {tutorial.type === 'video' ? <FaVideo className="text-xs" /> : <FaBook className="text-xs" />}
                          <span className="capitalize hidden sm:inline">{tutorial.type}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 text-white py-2 px-2 md:px-3 rounded text-xs md:text-sm hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-1">
                          <FaPlay className="text-xs" />
                          <span className="hidden sm:inline">Start</span>
                        </button>
                        <button
                          onClick={() => navigate(`/tutorial/${tutorial.id || tutorial._id}`)}
                          className="px-2 md:px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs md:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* No results state */}
            {filteredTutorials.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaSearch className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No tutorials found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your search terms or browse all categories
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory('all');
                      setSearchTerm('');
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    View All Tutorials
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                {tutorials.length}+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tutorials Available
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
                {tutorialCategories.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Categories
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
                24/7
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Access Anytime
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-2">
                Free
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                No Cost to Learn
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Overview */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Explore by Category
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
              Find tutorials tailored to your specific needs and interests
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tutorialCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center group ${
                  activeCategory === category.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="mb-2 flex justify-center">
                  {category.icon}
                </div>
                <div className={`text-sm font-medium ${
                  activeCategory === category.id
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 group-hover:text-blue-600'
                }`}>
                  {category.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {tutorials.filter(t => t.category === category.id).length} tutorials
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Need Help Getting Started?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Our tutorials are designed to be beginner-friendly with step-by-step instructions
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Quick Tips for Success
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Start with "Getting Started" tutorials</li>
                  <li>• Follow tutorials in the recommended order</li>
                  <li>• Practice each step before moving to the next</li>
                  <li>• Use the search to find specific topics</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Still Need Help?
                </h3>
                <div className="space-y-3">
                  <a
                    href="/support"
                    className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    Visit our Support Center →
                  </a>
                  <a
                    href="/contact"
                    className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    Contact our Team →
                  </a>
                  <a
                    href="/register"
                    className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Account to Start Learning
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            Ready to Start Learning?
          </h2>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            Create your free account and unlock access to all our tutorials and features
          </p>
          <a
            href="/register"
            className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Create Free Account
          </a>
        </div>
      </section>

      <Partners />
      <Footer />
    </>
  );
};

export default TutorialPage;