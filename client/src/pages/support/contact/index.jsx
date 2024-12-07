import React from "react";
import { FaEnvelope, FaFacebook, FaTwitter } from "react-icons/fa"; // Importing icons

const Contact = () => {
  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 w-full">
      <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
      <p className="my-3 text-gray-500 text-lg">
        You can reach us via the following channels:
      </p>

      <a 
        href="mailto:ogeobubu@gmail.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mb-4 p-4 bg-gray-100 rounded-lg flex items-center justify-between hover:bg-gray-200 transition duration-300"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex justify-center items-center mr-4">
            <FaEnvelope size={20} className="text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span>Email Address</span>
            <span className="text-gray-600">ogeobubu@gmail.com</span>
          </div>
        </div>
        <span className="text-blue-500 cursor-pointer transition-all transform hover:translate-x-2">
          ➔
        </span>
      </a>

      <a 
        href="https://www.facebook.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mb-4 p-4 bg-gray-100 rounded-lg flex items-center justify-between hover:bg-gray-200 transition duration-300"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex justify-center items-center mr-4">
            <FaFacebook size={20} className="text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span>Social Media</span>
            <span className="text-gray-600">Facebook</span>
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
        className="mb-4 p-4 bg-gray-100 rounded-lg flex items-center justify-between hover:bg-gray-200 transition duration-300"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex justify-center items-center mr-4">
            <FaTwitter size={20} className="text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span>Social Media</span>
            <span className="text-gray-600">X (formerly Twitter)</span>
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
