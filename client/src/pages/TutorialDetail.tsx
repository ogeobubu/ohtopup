import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../layout/header";
import Footer from "../pages/landing/footer";
import VideoPlayer from "../components/VideoPlayer";
import { getAllTutorials, getTutorialCategories } from "../api";
import {
  FaBook,
  FaVideo,
  FaClock,
  FaStar,
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight,
  FaPlay,
  FaDownload,
  FaShare,
  FaBookmark,
  FaRocket,
  FaCreditCard,
  FaGamepad,
  FaUser,
  FaHeadset,
  FaCheck
} from "react-icons/fa";

const TutorialDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(null); // 'loading', 'success', 'error'
  const [shareStatus, setShareStatus] = useState(null); // 'loading', 'success', 'error'
  const videoPlayerRef = useRef(null);

  const { data: tutorialsData, isLoading: tutorialsLoading } = useQuery({
    queryKey: ["tutorials"],
    queryFn: getAllTutorials,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["tutorialCategories"],
    queryFn: getTutorialCategories,
  });

  const tutorials = tutorialsData?.tutorials || [];
  const categories = categoriesData?.categories || [];

  const tutorial = tutorials.find(t => (t.id || t._id) === id);
  const category = categories.find(cat => cat.id === tutorial?.category);

  // Get related tutorials from same category
  const relatedTutorials = tutorials
    .filter(t => t.category === tutorial?.category && (t.id || t._id) !== (tutorial?.id || tutorial?._id))
    .slice(0, 3);

  // Get tutorial icon
  const getTutorialIcon = (category) => {
    switch (category) {
      case 'getting-started':
        return <FaRocket className="text-green-600 text-2xl" />;
      case 'payments':
        return <FaCreditCard className="text-purple-600 text-2xl" />;
      case 'gaming':
        return <FaGamepad className="text-yellow-600 text-2xl" />;
      case 'account':
        return <FaUser className="text-red-600 text-2xl" />;
      case 'support':
        return <FaHeadset className="text-blue-600 text-2xl" />;
      default:
        return <FaBook className="text-blue-600 text-2xl" />;
    }
  };

  // Download guide functionality
  const handleDownloadGuide = async () => {
    setDownloadStatus('loading');

    try {
      // Create the guide content
      let guideContent = `${tutorial.title}\n\n`;
      guideContent += `Category: ${category?.name || tutorial.category}\n`;
      guideContent += `Difficulty: ${tutorial.difficulty}\n`;
      guideContent += `Duration: ${tutorial.duration}\n`;
      guideContent += `Type: ${tutorial.type}\n\n`;
      guideContent += `Description:\n${tutorial.description}\n\n`;

      if (tutorial.steps && tutorial.steps.length > 0) {
        guideContent += `Step-by-Step Guide:\n\n`;
        tutorial.steps.forEach((step, index) => {
          guideContent += `${index + 1}. ${step}\n\n`;
        });
      }

      if (tutorial.videoUrl) {
        guideContent += `Video URL: ${tutorial.videoUrl}\n`;
      }

      // Create and download the file
      const blob = new Blob([guideContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tutorial.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_guide.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus(null), 3000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus(null), 3000);
    }
  };

  // Share tutorial functionality
  const handleShareTutorial = async () => {
    setShareStatus('loading');

    const shareUrl = window.location.href;
    const shareTitle = tutorial.title;
    const shareText = `Check out this tutorial: ${tutorial.title} - ${tutorial.description}`;

    try {
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus('success');
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('success');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback to copying URL manually
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setShareStatus('success');
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        setShareStatus('error');
      }
    }

    setTimeout(() => setShareStatus(null), 3000);
  };

  if (tutorialsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Loading tutorial...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="text-center max-w-md mx-auto">
            <FaBook className="text-4xl md:text-6xl text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Tutorial Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-6 text-sm md:text-base">
              The tutorial you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/tutorials')}
              className="px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base font-medium"
            >
              Back to Tutorials
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Back Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <button
            onClick={() => navigate('/tutorials')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
          >
            <FaArrowLeft className="text-sm" />
            <span>Back to Tutorials</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Tutorial Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="text-xl md:text-2xl">
                    {getTutorialIcon(tutorial.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                      {tutorial.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <FaClock className="text-xs" />
                        <span>{tutorial.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {tutorial.type === 'video' ? <FaVideo className="text-xs" /> : <FaBook className="text-xs" />}
                        <span className="capitalize">{tutorial.type}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        tutorial.difficulty === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        tutorial.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {tutorial.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                {tutorial.popular && (
                  <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium self-start sm:self-center">
                    <FaStar className="text-xs" />
                    <span>Popular</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">
                {tutorial.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={() => {
                    if (tutorial.type === 'video' && tutorial.videoUrl && videoPlayerRef.current) {
                      videoPlayerRef.current.play();
                    }
                  }}
                  className="flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
                >
                  <FaPlay className="text-sm" />
                  <span>Start Tutorial</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 md:px-4 py-2.5 md:py-3 border rounded-lg transition-colors font-medium text-sm ${
                      isBookmarked
                        ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FaBookmark className="text-sm" />
                    <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                  </button>
                  <button
                    onClick={handleShareTutorial}
                    disabled={shareStatus === 'loading'}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {shareStatus === 'loading' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : shareStatus === 'success' ? (
                      <FaCheck className="text-sm text-green-600" />
                    ) : (
                      <FaShare className="text-sm" />
                    )}
                    <span className="hidden sm:inline">
                      {shareStatus === 'loading' ? 'Sharing...' :
                       shareStatus === 'success' ? 'Shared!' :
                       'Share'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tutorial Content */}
            {tutorial.type === 'video' && tutorial.videoUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
                  Video Tutorial
                </h2>
                <VideoPlayer
                  ref={videoPlayerRef}
                  url={tutorial.videoUrl}
                  title={tutorial.title}
                  description={tutorial.description}
                  duration={tutorial.duration}
                  onPlay={() => console.log('Video started')}
                  onPause={() => console.log('Video paused')}
                  onEnded={() => console.log('Video ended')}
                />
              </div>
            )}

            {/* Steps */}
            {tutorial.steps && tutorial.steps.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">
                  Step-by-Step Guide
                </h2>

                <div className="space-y-3 md:space-y-4">
                  {tutorial.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`p-3 md:p-4 rounded-lg border-l-4 transition-colors ${
                        index === currentStep
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium ${
                          index === currentStep
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white leading-relaxed text-sm md:text-base">
                            {step}
                          </p>
                        </div>
                        {index === currentStep && (
                          <FaCheckCircle className="text-green-500 flex-shrink-0 mt-1 text-sm md:text-base" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Step Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 md:mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    <FaArrowLeft className="text-sm" />
                    <span>Previous</span>
                  </button>

                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Step {currentStep + 1} of {tutorial.steps.length}
                  </div>

                  <button
                    onClick={() => setCurrentStep(Math.min(tutorial.steps.length - 1, currentStep + 1))}
                    disabled={currentStep === tutorial.steps.length - 1}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    <span>Next</span>
                    <FaArrowRight className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Tutorial Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">
                Tutorial Info
              </h3>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">
                    {category?.name || tutorial.category}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">
                    {tutorial.difficulty}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">
                    {tutorial.duration}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-gray-900 dark:text-white font-medium capitalize text-right">
                    {tutorial.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Tutorials */}
            {relatedTutorials.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">
                  Related Tutorials
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {relatedTutorials.map((relatedTutorial) => (
                    <div
                      key={relatedTutorial.id || relatedTutorial._id}
                      onClick={() => navigate(`/tutorial/${relatedTutorial.id || relatedTutorial._id}`)}
                      className="p-2 md:p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start space-x-2 mb-2">
                        <div className="text-base md:text-lg mt-0.5">
                          {getTutorialIcon(relatedTutorial.category)}
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-xs md:text-sm leading-tight flex-1">
                          {relatedTutorial.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                        {relatedTutorial.duration} • {relatedTutorial.difficulty}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleDownloadGuide}
                  disabled={downloadStatus === 'loading'}
                  className="w-full flex items-center space-x-2 px-3 md:px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadStatus === 'loading' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : downloadStatus === 'success' ? (
                    <FaCheck className="text-sm flex-shrink-0 text-green-600" />
                  ) : (
                    <FaDownload className="text-sm flex-shrink-0" />
                  )}
                  <span>
                    {downloadStatus === 'loading' ? 'Downloading...' :
                     downloadStatus === 'success' ? 'Downloaded!' :
                     downloadStatus === 'error' ? 'Download Failed' :
                     'Download Guide'}
                  </span>
                </button>
                <button
                  onClick={handleShareTutorial}
                  disabled={shareStatus === 'loading'}
                  className="w-full flex items-center space-x-2 px-3 md:px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shareStatus === 'loading' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : shareStatus === 'success' ? (
                    <FaCheck className="text-sm flex-shrink-0 text-green-600" />
                  ) : (
                    <FaShare className="text-sm flex-shrink-0" />
                  )}
                  <span>
                    {shareStatus === 'loading' ? 'Sharing...' :
                     shareStatus === 'success' ? 'Link Copied!' :
                     shareStatus === 'error' ? 'Share Failed' :
                     'Share Tutorial'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TutorialDetail;