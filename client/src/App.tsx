import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Routes from "./routes";
import { getUser } from "./api"
import { setUser } from "./actions/userActions";
import { setAdminUser } from "./actions/adminActions";
import { toggleDarkMode } from "./actions/themeActions";
import { useSelector, useDispatch } from "react-redux";
import { FaWhatsapp } from "react-icons/fa";

const App = () => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.theme.isDarkMode);
  const savedUser = useSelector(state => state.user.user)
  const savedAdminUser = useSelector(state => state.admin.user)

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Waking up the server... Please wait.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <ToastContainer />
      <Routes darkMode={isDarkMode} toggleDarkMode={handleToggleDarkMode} />

      <a
        href="https://wa.me/+2348154212889"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 bg-green-500 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-300"
        style={{ zIndex: 1000 }}
      >
        <FaWhatsapp size={24} />
      </a>
    </div>
  );
};

export default App;