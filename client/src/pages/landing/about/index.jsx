import React from "react";
import Navbar from "../navbar";
import Hero from "../hero";
import Partners from "../partners";
import Footer from "../footer";

const AboutUs = () => {
  return (
    <>
      <Navbar />
      <Hero
        heading="Stay Connected with Affordable Plans"
        subheading="Experience seamless connectivity with our tailored data packages designed for every lifestyle."
        buttonText="Browse Plans"
        href="/pricing"
      />
      <div className="container mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-center mb-10">About Us</h1>
        <p className="text-lg text-gray-700 mb-6">
          At OhTopUp, we are dedicated to providing our customers with the
          highest quality service and support. Founded in 2024, we are growing
          as a startup to be renowned trusted provider in the industry, offering
          a range of affordable and reliable plans designed to meet the diverse
          needs of our customers.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Our mission is to make quality data services accessible to everyone.
          We believe that everyone deserves to stay connected without breaking
          the bank. Our team works tirelessly to ensure that we offer
          competitive pricing without compromising on quality.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          We pride ourselves on our customer-centric approach. Your satisfaction
          is our top priority, and we are committed to providing you with the
          support you need every step of the way. Whether you have questions
          about our plans or need assistance, our friendly customer service team
          is here to help.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Thank you for choosing OhTopUp. We look forward to helping you find
          the perfect plan to suit your lifestyle and keep you connected to what
          matters most.
        </p>
      </div>
      <Partners />
      <Footer />
    </>
  );
};

export default AboutUs;
