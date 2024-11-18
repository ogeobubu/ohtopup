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
    <div className="border border-solid border-gray-200 rounded-md p-6">
      <h2 className="text-2xl font-bold mb-4">Services</h2>
      <div className="max-w-sm w-auto bg-[#F7F9FB] p-4 rounded-md">
        <div className="space-y-8">
          {data.map((service) => (
            <div key={service._id} className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="text-gray-500">{service.name}</span>
              </div>
              <div className="flex items-center">
                {service.isAvailable ? (
                  <>
                    <FaCheckCircle className="text-green-400 mr-1" aria-hidden="true" />
                    <span className="text-green-400 font-semibold" aria-label="Available">
                      Available
                    </span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-red-400 mr-1" aria-hidden="true" />
                    <span className="text-red-400 font-semibold" aria-label="Unavailable">
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