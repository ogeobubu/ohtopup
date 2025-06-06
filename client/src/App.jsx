import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import Routes from "./routes";
import { getUser } from "./api"
import { setUser } from "./actions/userActions";
import { setAdminUser } from "./actions/adminActions";
import { useSelector, useDispatch } from "react-redux";
import { FaWhatsapp } from "react-icons/fa";

const App = () => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.theme.isDarkMode);
  const savedUser = useSelector(state => state.user.user)
  const savedAdminUser = useSelector(state => state.admin.user)

  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
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
      dispatch(setAdminUser(user));
    }
  }, [savedAdminUser, user, dispatch])

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