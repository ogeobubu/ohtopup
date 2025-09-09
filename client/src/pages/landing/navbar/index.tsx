import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleDarkMode } from "../../../actions/themeActions";
import logo from "../../../assets/logo/logo-app.png";
import logoDark from "../../../assets/logo/new-dark.png";
import { FaMoon, FaSun } from "react-icons/fa"; // Import icons

const Navbar = () => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.theme.isDarkMode);
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const handleScroll = () => {
    setIsScrolled(window.scrollY > 0);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
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

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

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
              src={
                isScrolled
                  ? (isDarkMode ? logo : logoDark)
                  : (isDarkMode ? logoDark : logo)
              }
              alt="OhTopUp Logo"
            />
          </Link>
          <div className="hidden md:flex space-x-4 items-center">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/about" className="hover:underline">About Us</Link>
            <Link to="/pricing" className="hover:underline">Data Pricing</Link>
            <Link to="/tutorials" className="hover:underline">Tutorials</Link>
            <button
              onClick={() => dispatch(toggleDarkMode())}
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="flex items-center"
            >
              {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="px-4 py-2 rounded-lg border border-current hover:bg-gray-100 dark:hover:bg-gray-800">Login</Link>
            <Link to="/create" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Sign Up</Link>
          </div>
          <button
            ref={buttonRef}
            className="md:hidden focus:outline-none"
            onClick={toggleMenu}
          >
            <svg
              className={`w-6 h-6 ${isScrolled ? (isDarkMode ? "text-white" : "text-gray-800") : "text-white"}`}
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

      {/* Mobile menu */}
      <div
        ref={menuRef}
        className={`fixed z-20 top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <Link to="/" className="py-2 hover:underline" onClick={toggleMenu}>
            Home
          </Link>
          <Link to="/about" className="py-2 hover:underline" onClick={toggleMenu}>
            About Us
          </Link>
          <Link to="/pricing" className="py-2 hover:underline" onClick={toggleMenu}>
            Data Pricing
          </Link>
          <Link to="/tutorials" className="py-2 hover:underline" onClick={toggleMenu}>
            Tutorials
          </Link>
          <Link to="/login" className="mt-2 px-4 py-2 rounded-lg border border-current" onClick={toggleMenu}>
            Login
          </Link>
          <Link to="/create" className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white" onClick={toggleMenu}>
            Sign Up
          </Link>
          {/* Dark Mode Toggle for Mobile */}
          <button
            onClick={() => dispatch(toggleDarkMode())}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="flex items-center mt-4"
          >
            {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;