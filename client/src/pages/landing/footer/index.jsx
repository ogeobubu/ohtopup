import React from 'react';
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { MdPhone, MdEmail, MdLocationOn } from "react-icons/md";

const Footer = () => {
  return (
    <footer className="bg-[#21335a] text-white py-12 px-8 md:px-16 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="footerLeft w-full md:w-1/3 mb-6 md:mb-0">
          <Link to="/" className="text-xl font-bold md:text-2xl">OhTopUp</Link>
          <div className="flex items-center mt-2 text-sm md:text-base">
            <MdPhone className="mr-2" /> (+234) 08154212889
          </div>
          <div className="flex items-center mt-2 text-sm md:text-base">
            <MdEmail className="mr-2" /> ohtopup@gmail.com
          </div>
          <div className="flex items-center mt-2 text-sm md:text-base">
            <MdLocationOn className="mr-2" /> 
            <span>Lagos, Nigeria</span>
          </div>
        </div>

        <div className="aboutRight w-full md:w-1/3">
          <h4 className="text-lg font-semibold md:text-xl">Company</h4>
          <ul className="mt-2 list-none flex flex-col">
            <Link to="/about" className="mb-2 text-white hover:text-gray-300 dark:hover:text-gray-400 text-sm md:text-base">About</Link>
            <Link to="/pricing" className="mb-2 text-white hover:text-gray-300 dark:hover:text-gray-400 text-sm md:text-base">Data Pricing</Link>
          </ul>
        </div>
      </div>

      <hr className="my-4 border-white dark:border-gray-600" />

      <div className="flex justify-center social mb-4">
        {[
          { icon: <FaFacebook />, link: "https://facebook.com/ohtopup" },
          { icon: <FaTwitter />, link: "https://twitter.com/ohtopup" },
          { icon: <FaInstagram />, link: "https://instagram.com/" },
          { icon: <FaLinkedin />, link: "https://linkedin.com/" },
        ].map((social, index) => (
          <div key={index} className="socialItem flex justify-center items-center h-10 w-10 rounded-full bg-royalblue mr-4">
            <a className="text-white" href={social.link} target="_blank" rel="noreferrer">
              {social.icon}
            </a>
          </div>
        ))}
      </div>

      <p className="text-center text-sm md:text-base mt-6 font-light">
        OhTopUp &copy; {new Date().getFullYear()} - All Rights Reserved.
      </p>
    </footer>
  );
}

export default Footer;