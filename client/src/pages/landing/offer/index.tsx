import React from "react";

const Offer = () => {
  return (
    <section id="about" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto text-center px-4">
        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          What We Offer
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[ 
            { title: 'Instant Top‑ups', desc: 'Airtime, data, TV and electricity credited in seconds.' },
            { title: 'Best Prices', desc: 'Competitive rates with transparent fees.' },
            { title: 'Secure by Design', desc: 'Bank‑grade security and encrypted payments.' },
            { title: '24/7 Support', desc: 'Real humans to help you anytime.' },
          ].map((item) => (
            <div key={item.title} className="shadow-md p-6 rounded-lg bg-white text-gray-900 dark:bg-gray-900 dark:text-white text-left">
              <h4 className="font-semibold text-lg md:text-xl">{item.title}</h4>
              <p className="text-sm md:text-base mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Offer;