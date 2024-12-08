import React from 'react'
import { Link } from "react-router-dom"
import heroImage from "../../../assets/showcase.jpg";

const Hero = ({ heading, subheading, buttonText, href }) => {
  return (
    <section
        id="home"
        className="h-screen flex items-center justify-start bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="container mx-auto flex flex-col items-start text-white p-8 relative z-8">
          <h2 className="text-5xl font-bold">{heading}</h2>
          <p className="mt-4 text-lg">{subheading}</p>
          <Link to={href} className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-lg shadow-lg hover:bg-gray-200 transition">
            {buttonText}
          </Link>
        </div>
      </section>
  )
}

export default Hero