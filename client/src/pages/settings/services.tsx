import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getServices } from "../../api";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const Services = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });

  if (isLoading) {
    return <div className="text-sm text-muted">Loading services...</div>;
  }

  if (error) {
    return <div className="text-sm text-danger">Error fetching services: {(error as any).message}</div>;
  }

  return (
    <div className="rounded-md border border-line p-4 md:p-6">
      <h2 className="mb-3 text-xl font-bold md:mb-4 md:text-2xl">Services</h2>
      <div className="w-full max-w-sm rounded-md bg-bg p-3 dark:bg-gray-800 md:p-4">
        <div className="space-y-6 md:space-y-8">
          {data?.map((service: any) => (
            <div
              key={service._id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted md:text-base">{service.name}</span>
              </div>
              <div className="flex items-center self-start sm:self-auto">
                {service.isAvailable ? (
                  <>
                    <FaCheckCircle className="mr-1 text-sm text-success md:text-base" aria-hidden="true" />
                    <span className="text-sm font-semibold text-success md:text-base" aria-label="Available">
                      Available
                    </span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="mr-1 text-sm text-danger md:text-base" aria-hidden="true" />
                    <span className="text-sm font-semibold text-danger md:text-base" aria-label="Unavailable">
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
