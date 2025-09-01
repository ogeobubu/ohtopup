import React, { useEffect, useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const DeleteModal = ({ isDelete, closeDeleteModal, handleDeleteData, id }) => {
  const [isVisible, setIsVisible] = useState(isDelete);

  useEffect(() => {
    if (isDelete) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isDelete]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(closeDeleteModal, 300);
  };

  return (
    <div className={`fixed top-0 right-0 bottom-0 left-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white shadow-md rounded-md p-6 w-full max-w-md transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full opacity-0'}`}>
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close Modal"
        >
          <FaTimes className="w-5 h-5" />
        </button>
        <FaExclamationTriangle className="text-red-500 mb-4 text-2xl" />
        <h2 className="text-2xl font-bold mb-4">
          Are you sure you want to delete this notification?
        </h2>
        <p className="text-gray-700 mb-4">This action is irreversible.</p>
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded mr-4"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeleteData(id)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Delete Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;