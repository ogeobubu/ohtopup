import React from "react";
import { FaEnvelope, FaFacebook, FaTwitter } from "react-icons/fa"; // Importing icons
import { useSelector } from "react-redux"; // Import useSelector

const Contact = () => {
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  return (
    <div className={`border border-solid rounded-md p-6 w-full ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      <h2 className="text-2xl md:text-3xl font-bold mb-4">Contact Us</h2>
      <p className="my-3 text-gray-500 text-lg md:text-xl">
        You can reach us via the following channels:
      </p>

      <a
        href="mailto:ogeobubu@gmail.com"
        target="_blank"
        rel="noopener noreferrer"
        className={`mb-4 p-4 rounded-lg flex items-center justify-between transition duration-300 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex justify-center items-center mr-4">
            <FaEnvelope size={16} md:size={20} className="text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base">Email Address</span>
            <span className="text-gray-600 text-xs md:text-sm">ogeobubu@gmail.com</span>
          </div>
        </div>
        <span className="text-blue-500 cursor-pointer transition-all transform hover:translate-x-2 text-sm md:text-base">
          ➔
        </span>
      </a>

      <a 
        href="https://www.facebook.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`mb-4 p-4 rounded-lg flex items-center justify-between transition duration-300 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex justify-center items-center mr-4">
            <FaFacebook size={20} className="text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base">Social Media</span>
            <span className="text-gray-600 text-xs md:text-sm">Facebook</span>
          </div>
        </div>
        <span className="text-blue-500 cursor-pointer transition-all transform hover:translate-x-2">
          ➔
        </span>
      </a>

      <a 
        href="https://www.x.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`mb-4 p-4 rounded-lg flex items-center justify-between transition duration-300 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex justify-center items-center mr-4">
            <FaTwitter size={20} className="text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base">Social Media</span>
            <span className="text-gray-600 text-xs md:text-sm">X (formerly Twitter)</span>
          </div>
        </div>
        <span className="text-blue-500 cursor-pointer transition-all transform hover:translate-x-2">
          ➔
        </span>
      </a>

    </div>
  );
};

export default Contact;