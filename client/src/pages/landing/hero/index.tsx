import React from 'react';
import { Link } from "react-router-dom";
import heroImage from "../../../assets/showcase.jpg";

const Hero = ({ heading, subheading, buttonText, secondButtonText, href }) => {
  return (
    <section
      id="home"
      className="h-screen flex items-center justify-start bg-cover bg-center"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="container mx-auto flex flex-col items-start text-white p-6 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold">{heading}</h2>
        <p className="mt-4 text-base md:text-lg">{subheading}</p>
        <div className="flex flex-col md:flex-row md:gap-3 mt-6">
          <Link 
            to={href} 
            className="text-center bg-white text-blue-600 px-6 py-2 rounded-lg shadow-lg hover:bg-gray-200 transition"
          >
            {buttonText}
          </Link>
          {secondButtonText && (
            <Link 
              to="https://median.co/share/wwlxbr" 
              target="_blank" 
              className="bg-white text-blue-600 px-6 py-2 rounded-lg shadow-lg hover:bg-gray-200 transition mt-3 md:mt-0"
            >
              {secondButtonText}
            </Link>
          )}
        </div>
        <div className="mt-6 flex items-center space-x-4 text-sm text-gray-200">
          <span className="inline-flex items-center"><span className="mr-2">✅</span> Trusted by 10,000+ users</span>
          <span className="inline-flex items-center"><span className="mr-2">🔒</span> Secured payments</span>
          <span className="inline-flex items-center"><span className="mr-2">⚡</span> Instant delivery</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;