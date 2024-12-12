import React from "react";
import { useSelector } from "react-redux"; // Import useSelector for Redux

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const isDarkMode = useSelector(state => state.theme.isDarkMode); // Get dark mode from Redux

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`mx-1 px-2 py-1 sm:px-3 sm:py-2 rounded text-sm md:text-base transition duration-200 ${
            i === currentPage
              ? "bg-blue-500 text-white"
              : `${isDarkMode ? 'bg-gray-700 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-blue-300'}`
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className={`flex md:flex-row flex-col gap-1 md:gap-0 justify-between items-center my-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-2 rounded-lg shadow-md`}>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`bg-blue-500 text-white rounded px-4 py-2 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Previous
      </button>
      <div className="flex items-center overflow-x-auto md:overflow-visible">
        {renderPageNumbers()}
      </div>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`bg-blue-500 text-white rounded px-4 py-2 ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;