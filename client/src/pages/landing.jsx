import React from "react";

const Landing = ({ darkMode, toggleDarkMode }) => {
  return  <div className="h-[100vh] dark:bg-gray-800">
     <button
       onClick={toggleDarkMode}
       className="p-2 mb-4 bg-blue-500 text-white rounded"
     >
       Toggle Dark Mode
     </button>

   </div>;
};

export default Landing;
