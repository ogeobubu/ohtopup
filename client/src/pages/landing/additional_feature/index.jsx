import React from "react";

const AdditionalFeatures = () => {
  return (
    <section id="additional-features" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto text-center px-4">
        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Additional Features
        </h3>
        <div className="flex flex-col md:flex-row justify-around flex-wrap">
          <div className="shadow-md p-6 rounded-lg m-4 md:w-72 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
            <h4 className="font-semibold text-lg md:text-xl">Gift Points</h4>
            <p className="text-sm md:text-base">
              Earn points with every transaction and redeem them for discounts on future purchases.
            </p>
          </div>
          <div className="shadow-md p-6 rounded-lg m-4 md:w-72 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
            <h4 className="font-semibold text-lg md:text-xl">Referral Program</h4>
            <p className="text-sm md:text-base">
              Invite friends to join and earn rewards for each successful referral.
            </p>
          </div>
          <div className="shadow-md p-6 rounded-lg m-4 md:w-72 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
            <h4 className="font-semibold text-lg md:text-xl">User-Friendly Wallet</h4>
            <p className="text-sm md:text-base">
              Manage your balance easily, with options to withdraw or add funds seamlessly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdditionalFeatures;