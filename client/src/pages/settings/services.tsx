import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getServices } from "../../api";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const Services = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  });

  if (isLoading) {
    return <div>Loading services...</div>;
  }

  if (error) {
    return <div>Error fetching services: {error.message}</div>;
  }

  return (
    <div className="border border-solid border-gray-200 rounded-md p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Services</h2>
      <div className="max-w-sm w-full bg-[#F7F9FB] dark:bg-gray-800 p-3 md:p-4 rounded-md">
        <div className="space-y-6 md:space-y-8">
          {data?.map((service) => (
            <div key={service._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 dark:text-white text-sm md:text-base">{service.name}</span>
              </div>
              <div className="flex items-center self-start sm:self-auto">
                {service.isAvailable ? (
                  <>
                    <FaCheckCircle className="text-green-400 mr-1 text-sm md:text-base" aria-hidden="true" />
                    <span className="text-green-400 font-semibold text-sm md:text-base" aria-label="Available">
                      Available
                    </span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-red-400 mr-1 text-sm md:text-base" aria-hidden="true" />
                    <span className="text-red-400 font-semibold text-sm md:text-base" aria-label="Unavailable">
                      Unavailable
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;