import React from "react";
import Footer from "./footer";
import Navbar from "./navbar";
import Hero from "./hero";
import Offer from "./offer";
import AdditionalFeature from "./additional_feature";
import Partners from "./partners";
import FAQ from "./faq";
import Rating from "./rating";
import Usecase from "./use-case";
import CTA from "./cta";

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <Hero 
        heading="Paying Smart is Easy" 
        subheading="Pay your bills and enjoy discounts effortlessly." 
        buttonText="Get Started" 
        secondButtonText="Download App" 
        href="/login" 
      />
      <Offer />
      <AdditionalFeature />
      <Partners />
      <FAQ />
      <Usecase />
      <CTA />
      <Rating />
      <Footer />
    </div>
  );
};

export default HomePage;