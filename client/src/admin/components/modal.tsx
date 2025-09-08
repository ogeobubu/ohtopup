import React, { useRef, useEffect, useState } from "react";
import { FaTimes, FaArrowUp } from "react-icons/fa";

interface ModalProps {
  isOpen: boolean;
  closeModal: () => void;
  title?: string;
  children: React.ReactNode;
  isDarkMode?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  stickyHeader?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  closeModal,
  title,
  children,
  isDarkMode,
  size = 'md',
  showCloseButton = true,
  stickyHeader
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Size configurations with responsive breakpoints
  const sizeClasses = {
    sm: 'max-w-sm w-full mx-4',
    md: 'max-w-md w-full mx-4 sm:mx-auto',
    lg: 'max-w-lg w-full mx-4 sm:max-w-2xl sm:mx-auto',
    xl: 'max-w-xl w-full mx-4 sm:max-w-3xl md:max-w-4xl lg:max-w-5xl',
    full: 'max-w-full w-full mx-2 sm:mx-4 md:mx-6 lg:mx-auto lg:max-w-6xl xl:max-w-7xl'
  };

  // Keyboard navigation for scrolling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !contentRef.current) return;

      const modalElement = contentRef.current;
      const { scrollTop, scrollHeight, clientHeight } = modalElement;

      switch (event.key) {
        case 'ArrowUp':
          if (scrollTop > 0) {
            event.preventDefault();
            modalElement.scrollBy({ top: -50, behavior: 'smooth' });
          }
          break;
        case 'ArrowDown':
          if (scrollTop < scrollHeight - clientHeight) {
            event.preventDefault();
            modalElement.scrollBy({ top: 50, behavior: 'smooth' });
          }
          break;
        case 'PageUp':
          event.preventDefault();
          modalElement.scrollBy({ top: -clientHeight, behavior: 'smooth' });
          break;
        case 'PageDown':
          event.preventDefault();
          modalElement.scrollBy({ top: clientHeight, behavior: 'smooth' });
          break;
        case 'Home':
          event.preventDefault();
          modalElement.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'End':
          event.preventDefault();
          modalElement.scrollTo({ top: scrollHeight, behavior: 'smooth' });
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the modal for keyboard navigation
      setTimeout(() => contentRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Scroll event listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = contentRef.current.scrollTop;
        setShowScrollTop(scrollTop > 200); // Show button after scrolling 200px
      }
    };

    const modalElement = contentRef.current;
    if (modalElement && isOpen) {
      modalElement.addEventListener('scroll', handleScroll);
      return () => modalElement.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen]);

  // Scroll to top function
  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && showCloseButton) {
      closeModal();
    }
  };

  return (
    <div
      className={`fixed z-50 inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center p-2 sm:p-4 md:p-6 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative shadow-2xl rounded-2xl w-full ${sizeClasses[size]} mx-auto transition-all duration-300 transform ${
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          } ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
          max-h-[95vh] sm:max-h-[90vh] overflow-hidden focus:outline-none`}
        style={{
          visibility: isOpen ? "visible" : "hidden",
        }}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking modal content
      >
        {/* Sticky Header Area */}
        {(title || stickyHeader) && (
          <div className="sticky top-0 z-20 bg-inherit">
            {/* Header with close button - only show if title is provided */}
            {title && (
              <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-600">
                <h2 id="modal-title" className="text-lg sm:text-xl font-semibold pr-2 flex-1 truncate">{title}</h2>
                {showCloseButton && (
                  <button
                    onClick={closeModal}
                    className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                    aria-label="Close Modal"
                  >
                    <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Sticky Header Content */}
            {stickyHeader && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600">
                {stickyHeader}
              </div>
            )}
          </div>
        )}

        {/* Close button in top-right corner for modals without title */}
        {!title && !stickyHeader && showCloseButton && (
          <button
            onClick={closeModal}
            className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white bg-gray-800'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700 bg-white'
            } shadow-lg`}
            aria-label="Close Modal"
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Scrollable Content Area */}
        <div
          ref={contentRef}
          className="modal-content overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700 dark:hover:scrollbar-thumb-gray-500 transition-colors duration-200 px-4 sm:px-6 py-4 pb-8 sm:pb-12"
          style={{
            maxHeight: stickyHeader
              ? "calc(95vh - 140px)"
              : title
                ? "calc(95vh - 100px)"
                : "calc(95vh - 40px)",
            height: "auto",
            minHeight: "120px",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
            scrollbarColor: isDarkMode ? "#4B5563 #374151" : "#D1D5DB #F9FAFB",
            overscrollBehavior: "contain",
            paddingBottom: "160px",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {/* Scroll indicator for mobile */}
          <div className="flex justify-center mb-4 md:hidden">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full opacity-60"></div>
          </div>

          {/* Scroll to top button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-white hover:bg-gray-50 text-gray-600'
              }`}
              aria-label="Scroll to top"
            >
              <FaArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;