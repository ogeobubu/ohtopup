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
        heading="About OhTopUp"
        subheading="A simpler, faster way to buy airtime, data, TV and electricity — built for everyone."
        buttonText="Browse Plans"
        href="/pricing"
      />
      <div className="container mx-auto py-16 md:py-20 px-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12 text-gray-900 dark:text-white">
          Our Mission & Story
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div>
            <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-4 md:mb-6">
              We started OhTopUp in 2024 with a simple idea: make utility top‑ups effortless and affordable for everyone. 
              From airtime and data to TV and electricity, our platform delivers instant value at transparent prices.
            </p>
            <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-4 md:mb-6">
              Today, thousands of customers trust OhTopUp for fast delivery, bank‑grade security, and a delightful wallet experience. 
              We focus on reliability so you can focus on what matters: staying connected.
            </p>
            <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-4 md:mb-6">
              Our team is customer‑obsessed. We listen, ship improvements quickly, and provide 24/7 support when you need it.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg p-6 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
              <h2 className="text-xl md:text-2xl font-semibold mb-2">Why choose OhTopUp?</h2>
              <ul className="list-none space-y-2 text-sm md:text-base">
                <li><span aria-hidden>⚡</span> Instant top‑ups across major networks</li>
                <li><span aria-hidden>💸</span> Competitive, transparent pricing</li>
                <li><span aria-hidden>🔒</span> Bank‑grade security and encrypted payments</li>
                <li><span aria-hidden>🕑</span> 24/7 human support</li>
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{k:'Users',v:'10k+'},{k:'Delivery',v:'Instant'},{k:'Support',v:'24/7'}].map(s => (
                <div key={s.k} className="rounded-lg p-4 text-center bg-white dark:bg-gray-900 shadow">
                  <div className="text-xl md:text-2xl font-bold text-blue-600">{s.v}</div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{s.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-14 text-center">
          <a href="/create" className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
            Create a free account
          </a>
        </div>
      </div>
      <Partners />
      <Footer />
    </>
  );
};

export default AboutUs;