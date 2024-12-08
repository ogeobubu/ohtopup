import React from 'react'
import { Link } from "react-router-dom"
import { FaFacebook, FaTwitter } from "react-icons/fa";
import { MdPhone, MdEmail } from "react-icons/md";

const Footer = () => {
  return (
    <footer className="bg-[#21335a] text-white py-12 px-8 md:px-16">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="footerLeft w-full md:w-1/3 mb-6 md:mb-0">
            <Link to="/" className="text-xl font-bold">OhTopUp</Link>
            <div className="flex items-center mt-2 contactItem">
              <MdPhone className="mr-2" /> 08092288446
            </div>
            <div className="flex items-center mt-2 contactItem">
              <MdEmail className="mr-2" /> ohtopupsupport@gmail.com
            </div>
          </div>

          <div className="aboutRight w-full md:w-1/3">
            <h4 className="text-lg font-semibold">Company</h4>
            <ul className="mt-2 list-none flex flex-col">
              <Link to="/about" className="mb-2">About</Link>
              <Link to="/pricing" className="mb-2">Data Pricing</Link>
            </ul>
          </div>
        </div>

        <hr className="my-4 border-white" />

        <div className="flex justify-center social mb-4">
          <div className="socialItem flex justify-center items-center h-10 w-10 rounded-full bg-royalblue mr-4">
            <a
              className="text-white"
              href="https://facebook.com/retoholdingsservices"
              target="_blank"
              rel="noreferrer"
            >
              <FaFacebook />
            </a>
          </div>
          <div className="socialItem flex justify-center items-center h-10 w-10 rounded-full bg-royalblue">
            <a
              className="text-white"
              href="https://twitter.com/"
              target="_blank"
              rel="noreferrer"
            >
              <FaTwitter />
            </a>
          </div>
        </div>

        <p className="text-center text-sm trademark mt-6 font-light">
          OhTopUp &copy; {new Date().getFullYear()} - All Rights Reserved.
        </p>
      </footer>
  )
}

export default Footer