import React from "react";

const AdditionalFeatures = () => {
  return (
    <section id="additional-features" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto text-center px-4">
        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Additional Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[
            { title: 'Gift Points', desc: 'Earn points on every purchase and redeem for discounts or cash.' },
            { title: 'Referral Rewards', desc: 'Invite friends and earn when they transact.' },
            { title: 'Smart Wallet', desc: 'Fund, withdraw, and track spend from one secure wallet.' },
            { title: 'Transaction History', desc: 'Filter and export your receipts anytime.' },
            { title: 'Multi‑network Support', desc: 'MTN, Glo, Airtel, 9mobile and more.' },
            { title: 'Notifications', desc: 'Real‑time alerts for every transaction.' },
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

export default AdditionalFeatures;