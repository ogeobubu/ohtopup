import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/logo/logo-app.png";
import logoDark from "../../../assets/logo/new-dark.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScroll = () => {
    setIsScrolled(window.scrollY > 0);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div>
      <nav
        className={`p-4 fixed top-0 z-30 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white text-gray-800 shadow-lg"
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
          <button className="md:hidden focus:outline-none" onClick={toggleMenu}>
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

      <div
        className={`fixed z-20 top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <button
            className="self-end p-4 absolute top-0 right-0"
            onClick={toggleMenu}
          >
            <svg
              className="w-6 h-6 text-gray-800"
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
          <Link to="/" className="py-2 hover:underline">
            Home
          </Link>
          <Link to="/about" className="py-2 hover:underline">
            About Us
          </Link>
          <Link to="/pricing" className="py-2 hover:underline">
            Data Pricing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
