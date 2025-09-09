import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../navbar";
import Hero from "../hero";
import Partners from "../partners";
import Footer from "../footer";
import { getPricing } from "../../../api";
import dstv from "../../../assets/dstv.png";
import mtn from "../../../assets/mtn.png";
import glo from "../../../assets/glo.png";
import airtel from "../../../assets/airtel.svg";
import nineMobile from "../../../assets/9mobile.svg";
import defaultNetworkImage from "../../../assets/default-network.png";

const imageMap = {
  mtn: mtn,
  MTN: mtn,
  glo: glo,
  Glo: glo,
  airtel: airtel,
  Airtel: airtel,
  '9mobile': nineMobile,
  '9MOBILE': nineMobile,
  dstv: dstv,
  DSTV: dstv,
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

  const [search, setSearch] = useState("");
  const [network, setNetwork] = useState("all");
  const [sort, setSort] = useState("name");

  const plans = pricingPlans?.data ?? [];
  const filtered = useMemo(() => {
    const byNetwork = network === "all" ? plans : plans.filter((p) => p.network.toLowerCase().startsWith(network.toLowerCase()));
    const bySearch = search
      ? byNetwork.filter((p) =>
          [p.name, p.planId, p.network, p.planType].some((t) => String(t || '').toLowerCase().includes(search.toLowerCase()))
        )
      : byNetwork;
    const sorted = [...bySearch].sort((a, b) => {
      if (sort === "price") return Number(a.finalPrice || a.price) - Number(b.finalPrice || b.price);
      return String(a.name).localeCompare(String(b.name));
    });
    return sorted;
  }, [plans, search, network, sort]);

  return (
    <>
      <Navbar />
      <Hero
        heading="Choose Your Perfect Plan"
        subheading="Find affordable data plans across all major networks."
        buttonText="Create Free Account"
        secondButtonText="View All Plans"
        href="/create"
      />
      <div className="container mx-auto py-20 px-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="loader border-4 border-gray-300 border-t-4 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">
            Error fetching pricing data!
          </div>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8 text-gray-900 dark:text-white">
              Pricing Plans
            </h1>

            {/* Filters */}
            <div className="mb-6 md:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plan name or code"
                className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              >
                <option value="all">All Networks</option>
                <option value="mtn">MTN</option>
                <option value="glo">Glo</option>
                <option value="airtel">Airtel</option>
                <option value="9mobile">9mobile</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              >
                <option value="name">Sort: Name</option>
                <option value="price">Sort: Price</option>
              </select>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">{filtered.length} plans</span>
                <a href="/create" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Create account</a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((plan) => {
                const networkName = plan.network;
                let imageSrc = imageMap[networkName] || defaultNetworkImage;

                return (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-5 md:p-6 text-center"
                  >
                    <div className="rounded-full border border-solid border-gray-500 w-12 h-12 flex justify-center items-center mb-4 p-1 mx-auto">
                      <img
                        src={imageSrc}
                        alt={networkName}
                        className="object-cover mx-auto"
                      />
                    </div>
                    <h2 className="text-sm md:text-base font-semibold mb-2 text-gray-900 dark:text-white">
                      {plan.name}
                    </h2>
                    <div className="mb-4">
                      <p className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300">
                        {formatPrice(Math.round(plan.finalPrice) || Math.round(plan.price))}
                      </p>
                      {plan.commissionRate > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {plan.commissionRate}% commission
                        </p>
                      )}
                    </div>
                    <div className="flex justify-center gap-2">
                      <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm">
                        Select Plan
                      </button>
                      <button className="border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-900 transition text-sm">
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <Partners />
      <Footer />
    </>
  );
};

export default DataPricing;