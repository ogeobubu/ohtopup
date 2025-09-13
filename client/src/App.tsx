import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Routes from "./routes";
import ScrollToTop from "./components/ScrollToTop";
import { getUser } from "./api"
import { setUser } from "./actions/userActions";
import { setAdminUser } from "./actions/adminActions";
import { toggleDarkMode } from "./actions/themeActions";
import { useSelector, useDispatch } from "react-redux";
import { FaWhatsapp } from "react-icons/fa";

const App = () => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode || false);
  const savedUser = useSelector((state: any) => state.user?.user);
  const savedAdminUser = useSelector((state: any) => state.admin?.user);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  useEffect(() => {
    if(savedUser) {
      return;
    } else {
      dispatch(setUser(user));
    }
  }, [savedUser, user, dispatch])

  useEffect(() => {
    if(savedAdminUser) {
      return;
    } else {
      // For admin, we need to fetch admin user data separately
      // This should be handled by the admin API in the component
      // For now, we'll set it to null to avoid incorrect data
      dispatch(setAdminUser(null));
    }
  }, [savedAdminUser, dispatch])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Keep server alive with periodic health checks
  useEffect(() => {
    const keepAlive = () => {
      fetch('/api/health', { method: 'GET' })
        .catch(() => {
          // Silently handle errors to avoid console spam
        });
    };

    // Check every 5 minutes to keep server warm
    const interval = setInterval(keepAlive, 5 * 60 * 1000);

    // Initial check
    keepAlive();

    return () => clearInterval(interval);
  }, []);

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your account...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a moment on first load</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <ScrollToTop />
      <ToastContainer />
      <Routes darkMode={isDarkMode} toggleDarkMode={handleToggleDarkMode} />

      {/* <a
        href="https://wa.me/+2348154212889"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 bg-green-500 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-300"
        style={{ zIndex: 1000 }}
      >
       <FaWhatsapp size={24} />
      </a> */}
    </div>
  );
};

export default App;