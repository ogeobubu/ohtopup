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

  return (
    <div className="flex justify-between my-4">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="bg-blue-500 text-white rounded px-4 py-2"
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="bg-blue-500 text-white rounded px-4 py-2"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;