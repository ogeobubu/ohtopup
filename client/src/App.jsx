import React, { useState } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import Routes from "./routes";

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  return (
    <>
      <ToastContainer />
      <Routes darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </>
  );
};

export default App;
