import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/logo/logo-app.png";
import logoDark from "../../../assets/logo/new-dark.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Create refs for the menu and the toggle button
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const handleScroll = () => {
    setIsScrolled(window.scrollY > 0);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Effect to handle clicks outside the menu
  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Check if the menu is open and the click is outside the menu ref and the button ref
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    // Add the event listener
    document.addEventListener("mousedown", handleOutsideClick);

    // Clean up the event listener on component unmount or when menu state changes
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]); // Re-run effect if isMenuOpen changes

  // Effect to handle scroll for navbar background
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div>
      <nav
        className={`p-4 fixed top-0 z-30 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-lg"
            : "bg-transparent text-white"
        }`}
      >
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/">
            <img
              className="h-12"
              src={isScrolled ? logoDark : logo}
              alt="OhTopUp Logo"
            />
          </Link>
          <div className="hidden md:flex space-x-4">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <Link to="/about" className="hover:underline">
              About Us
            </Link>
            <Link to="/pricing" className="hover:underline">
              Data Pricing
            </Link>
          </div>
          {/* Assign the ref to the button */}
          <button
            ref={buttonRef}
            className="md:hidden focus:outline-none"
            onClick={toggleMenu}
          >
            <svg
              className={`w-6 h-6 ${
                isScrolled ? "text-gray-800" : "text-white"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Assign the ref to the mobile menu div */}
      <div
        ref={menuRef}
        className={`fixed z-20 top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <button
            className="self-end p-4 absolute top-0 right-0"
            onClick={toggleMenu}
          >
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <Link to="/" className="py-2 hover:underline" onClick={toggleMenu}> {/* Added onClick to close menu on link click */}
            Home
          </Link>
          <Link to="/about" className="py-2 hover:underline" onClick={toggleMenu}> {/* Added onClick to close menu on link click */}
            About Us
          </Link>
          <Link to="/pricing" className="py-2 hover:underline" onClick={toggleMenu}> {/* Added onClick to close menu on link click */}
            Data Pricing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;