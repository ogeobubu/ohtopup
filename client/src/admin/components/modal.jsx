import React from "react";
import { FaTimes } from "react-icons/fa";

const Modal = ({ isOpen, closeModal, title, children }) => {
  return (
    <div
      className={`fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`fixed top-0 right-0 h-screen bg-white shadow-md rounded-md p-6 w-full max-w-sm transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          visibility: isOpen ? "visible" : "hidden",
        }}
      >
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close Modal"
        >
          <FaTimes className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;