import PropTypes from 'prop-types';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const btn =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-tint disabled:opacity-45 disabled:cursor-not-allowed';
const activeBtn =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-transparent bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-dark';

const ModernPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-4 text-[11px] text-muted">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={btn}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          <FaChevronLeft /> Previous
        </button>

        {pageNumbers.map((pageNum, index) => (
          <div key={index}>
            {pageNum === '...' ? (
              <span className="px-2 py-1.5 text-xs text-muted">...</span>
            ) : (
              <button
                onClick={() => onPageChange(pageNum)}
                className={currentPage === pageNum ? activeBtn : btn}
              >
                {pageNum}
              </button>
            )}
          </div>
        ))}

        <button
          className={btn}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

ModernPagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default ModernPagination;
