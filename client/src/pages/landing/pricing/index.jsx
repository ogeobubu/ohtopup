import React from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../navbar";
import Hero from "../hero";
import Partners from "../partners";
import Footer from "../footer";
import { getPricing } from "../../../api";
import dstv from "../../../assets/dstv.png";
import mtn from "../../../assets/mtn.png";
import glo from "../../../assets/glo.png";

const imageMap = {
  mtn: mtn,
  dstv: dstv,
  glo: glo,
};

const formatPrice = (amount) => {
  return `₦${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

const DataPricing = () => {
  const {
    data: pricingPlans,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["pricing"],
    queryFn: getPricing,
  });

  if (isLoading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">Error fetching pricing data!</div>
    );
  }

  return (
    <>
      <Navbar />
      <Hero
        heading="Choose Your Perfect Plan"
        subheading="Affordable plans designed to fit your lifestyle."
        buttonText="Explore Our Plans"
        href=""
      />
      <div className="container mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
          Pricing Plans
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {pricingPlans.map((plan) => {
            const serviceName = plan.variationCode.split("-")[0];

            return (
              <div
                key={plan.id}
                className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center"
              >
                <div className="rounded-full border border-solid border-gray-500 w-12 h-12 flex justify-center items-center mb-4 p-1 mx-auto">
                  <img
                    src={imageMap[serviceName]}
                    alt={serviceName}
                    className="object-cover mx-auto"
                  />
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {plan.name}
                </h2>

                <p className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">
                  {formatPrice(plan.dataLimit)}
                </p>
                <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                  Select Plan
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <Partners />
      <Footer />
    </>
  );
};

export default DataPricing;