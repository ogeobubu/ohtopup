import React from "react";

const CTA = () => {
  return (
    <section className="py-20 bg-blue-600 text-white text-center">
      <div className="container mx-auto px-4">
        <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h3>
        <p className="text-base md:text-lg mb-6">
          Join us today and enjoy seamless transactions, discounts, and more!
        </p>
        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
          <a
            href="/create"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition w-full md:w-auto"
          >
            Sign Up
          </a>
          <a
            target="_blank"
            href="https://median.co/share/wwlxbr"
            className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition w-full md:w-auto"
          >
            Download App
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;