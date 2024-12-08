import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"
import Footer from "./footer"
import Navbar from "./navbar"
import Hero from "./hero"
import Partners from "./partners"
import Offer from "./offer"
import Rating from "./rating"

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <Hero heading="Paying smart is" subheading="When you pay for bills and you get discounts." buttonText="Get Started" href="/login" />
      <Partners />
      <Offer />
      <Rating />
      <Footer />
    </div>
  );
};

export default HomePage;