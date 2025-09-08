import React from "react";

const testimonials = [
  {
    quote: 'I topped up my data in 10 seconds. Prices are great and it just works.',
    author: 'Amaka O., Lagos',
    rating: 5,
  },
  {
    quote: 'Electricity tokens arrive instantly. The wallet is super easy to use.',
    author: 'Tunde A., Abuja',
    rating: 5,
  },
  {
    quote: 'I love the points and referrals. I actually save money every month.',
    author: 'Grace K., Port Harcourt',
    rating: 5,
  },
  {
    quote: 'OhTopUp has revolutionized how I handle my utility payments. Fast and reliable!',
    author: 'John D., Kano',
    rating: 5,
  },
  {
    quote: 'The app is intuitive and the customer support is top-notch. Highly recommended.',
    author: 'Sarah M., Ibadan',
    rating: 5,
  },
  {
    quote: 'Saved so much on my monthly bills thanks to their competitive rates.',
    author: 'Emeka N., Enugu',
    rating: 5,
  },
];

const Rating = () => (
  <section className="py-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
    <div className="container mx-auto text-center px-4">
      <h3 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        What Our Customers Say
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {testimonials.map((t) => (
          <blockquote key={t.author} className="bg-white dark:bg-gray-800 rounded-xl p-6 text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-yellow-400 text-lg mb-3" aria-label={`rating ${t.rating} stars`}>
              {'★'.repeat(t.rating)}
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">"{t.quote}"</p>
            <footer className="text-sm text-gray-500 dark:text-gray-400 font-medium">— {t.author}</footer>
          </blockquote>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Join thousands of satisfied customers</p>
        <div className="flex justify-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-yellow-400 text-xl">★</span>
          ))}
          <span className="ml-2 text-gray-600 dark:text-gray-400">4.9/5 from 2,500+ reviews</span>
        </div>
      </div>
    </div>
  </section>
);

export default Rating;