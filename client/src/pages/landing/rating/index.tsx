import React from "react";

const testimonials = [
  {
    quote: 'I topped up my data in 10 seconds. Prices are great and it just works.',
    author: 'Amaka O., Lagos',
  },
  {
    quote: 'Electricity tokens arrive instantly. The wallet is super easy to use.',
    author: 'Tunde A., Abuja',
  },
  {
    quote: 'I love the points and referrals. I actually save money every month.',
    author: 'Grace K., Port Harcourt',
  },
];

const Rating = () => (
  <section className="py-20 bg-white dark:bg-gray-800">
    <div className="container mx-auto text-center px-4">
      <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        What Customers Say
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {testimonials.map((t) => (
          <blockquote key={t.author} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-left">
            <div className="text-yellow-500 text-xl mb-2" aria-label="rating">★★★★★</div>
            <p className="text-gray-700 dark:text-gray-300">“{t.quote}”</p>
            <footer className="mt-3 text-sm text-gray-500">— {t.author}</footer>
          </blockquote>
        ))}
      </div>
    </div>
  </section>
);

export default Rating;