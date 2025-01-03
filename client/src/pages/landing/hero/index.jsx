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
      <div className="container mx-auto flex flex-col items-start text-white p-8 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold">{heading}</h2>
        <p className="mt-4 text-base md:text-lg">{subheading}</p>
        <div className="flex gap-3 md:flex-row flex-col">
        <Link to={href} className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-lg shadow-lg hover:bg-gray-200 transition">
          {buttonText}
        </Link>
        {secondButtonText && <Link target="_blank" to="https://median.co/share/wwlxbr" className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-lg shadow-lg hover:bg-gray-200 transition">
          {secondButtonText}
        </Link>}
        </div>
        
      </div>
    </section>
  );
}

export default Hero;