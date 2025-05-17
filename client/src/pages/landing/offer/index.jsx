import React from "react";

const Offer = () => {
  return (
    <section id="about" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto text-center px-4">
        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          What We Offer
        </h3>
        <div className="flex flex-col md:flex-row justify-around flex-wrap">
          <div className="shadow-md p-6 rounded-lg m-4 md:w-72 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
            <h4 className="font-semibold text-lg md:text-xl">Fast Transactions</h4>
            <p className="text-sm md:text-base">Experience lightning-fast data top-ups at your fingertips.</p>
          </div>
          <div className="shadow-md p-6 rounded-lg m-4 md:w-72 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
            <h4 className="font-semibold text-lg md:text-xl">Secure Payments</h4>
            <p className="text-sm md:text-base">Your transactions are secured with the best encryption technologies.</p>
          </div>
          <div className="shadow-md p-6 rounded-lg m-4 md:w-72 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
            <h4 className="font-semibold text-lg md:text-xl">24/7 Support</h4>
            <p className="text-sm md:text-base">Our support team is here to help you at any time of the day.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Offer;