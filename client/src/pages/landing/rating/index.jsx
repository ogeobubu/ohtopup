import React from "react";

const Rating = () => (
  <section className="py-20 bg-white dark:bg-gray-800">
    <div className="container mx-auto text-center px-4">
      <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Customer Ratings
      </h3>
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="text-yellow-500 text-4xl sm:text-5xl">
          ⭐⭐⭐⭐⭐
        </div>
        <p className="text-base md:text-lg max-w-lg text-gray-700 dark:text-gray-300">
          "Best platform for quick and reliable data top-ups!"
        </p>
      </div>
    </div>
  </section>
);

export default Rating;