import React from "react";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="container mx-auto px-4 relative z-10">
        <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h3>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of users who trust OhTopUp for their utility needs. Sign up today and experience the difference!
        </p>
        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
          <a
            href="/create"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg w-full md:w-auto"
          >
            Create Free Account
          </a>
          <a
            target="_blank"
            href="https://median.co/share/wwlxbr"
            className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 hover:scale-105 transition-all duration-300 w-full md:w-auto"
          >
            Download App
          </a>
        </div>
        <div className="mt-8 flex flex-col md:flex-row justify-center md:space-x-8 space-y-2 md:space-y-0 text-sm">
          <span className="flex items-center justify-center"><span className="mr-2">🚀</span> Free to start</span>
          <span className="flex items-center justify-center"><span className="mr-2">💎</span> Premium support</span>
          <span className="flex items-center justify-center"><span className="mr-2">🎉</span> Exclusive offers</span>
        </div>
      </div>
    </section>
  );
};

export default CTA;