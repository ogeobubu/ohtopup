import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
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
          className={`mx-1 px-3 py-2 rounded ${
            i === currentPage ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-blue-300"
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="flex justify-between items-center my-4">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`bg-blue-500 text-white rounded px-4 py-2 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Previous
      </button>
      <div className="flex items-center">
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