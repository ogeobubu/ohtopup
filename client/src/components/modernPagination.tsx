import PropTypes from 'prop-types';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ModernPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
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
    <div className="ot-transactions-pagination" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="ot-button ot-button-secondary"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          style={{ minHeight: 36, padding: '6px 12px', fontSize: 12 }}
        >
          <FaChevronLeft /> Previous
        </button>

        {pageNumbers.map((pageNum, index) => (
          <div key={index}>
            {pageNum === '...' ? (
              <span style={{ padding: '6px 8px', fontSize: 12, color: 'var(--ot-muted)' }}>...</span>
            ) : (
              <button
                onClick={() => onPageChange(pageNum)}
                className={currentPage === pageNum ? 'ot-button ot-button-primary' : 'ot-button ot-button-secondary'}
                style={{ minHeight: 36, padding: '6px 12px', fontSize: 12 }}
              >
                {pageNum}
              </button>
            )}
          </div>
        ))}

        <button
          className="ot-button ot-button-secondary"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          style={{ minHeight: 36, padding: '6px 12px', fontSize: 12 }}
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
