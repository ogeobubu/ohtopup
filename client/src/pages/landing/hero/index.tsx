import React from 'react';
import { Link } from "react-router-dom";
import heroImage from "../../../assets/showcase.jpg";

const Hero = ({ heading, subheading, buttonText, secondButtonText, href }) => {
  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-start bg-cover bg-center pt-16 md:pt-0"
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
        <div className="mt-6 flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-200">
          <span className="inline-flex items-center"><span className="mr-2">✅</span> Trusted by 10,000+ users</span>
          <span className="inline-flex items-center"><span className="mr-2">🔒</span> Bank-grade security</span>
          <span className="inline-flex items-center"><span className="mr-2">⚡</span> Instant delivery</span>
          <span className="inline-flex items-center"><span className="mr-2">💳</span> Multiple payment options</span>
        </div>
        <div className="mt-4 flex items-center space-x-4">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">SSL Secured</div>
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">24/7 Support</div>
        </div>
      </div>
    </section>
  );
}

export default Hero;