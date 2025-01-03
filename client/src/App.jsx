import React, { useEffect } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import Routes from "./routes";
import { useSelector, useDispatch } from "react-redux";
import { FaWhatsapp } from "react-icons/fa"; // Importing WhatsApp icon

const App = () => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.theme.isDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

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