import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getServiceID } from "../../../../api";
import {
  saveData,
  getDataVariationCodes,
  getSavedVariations,
  toggleData,
} from "../../../api";
import { Formik, Form, ErrorMessage } from "formik";
import Button from "../../../../components/ui/forms/button";
import { toast } from "react-toastify";
import { AiOutlineExclamationCircle, AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiCheck, FiX } from 'react-icons/fi';

const Data = () => {
  const queryClient = useQueryClient();
  const [identifier] = useState("data");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queryId, setQueryId] = useState(null);
  const [selectedVariations, setSelectedVariations] = useState([]);
  const [activeTab, setActiveTab] = useState("Set");
  const [isToggling, setIsToggling] = useState(null); // Track which variation is being toggled

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSelectedVariations([]);
    setQueryId(null);
  };

  // Queries with loading states
  const { 
    data: variations, 
    isLoading: isLoadingVariations 
  } = useQuery({
    queryKey: ["variations", queryId],
    queryFn: () => queryId ? getDataVariationCodes(queryId) : Promise.resolve([]),
    enabled: !!queryId,
  });

  const { 
    data: getVariations, 
    isLoading: isLoadingSavedVariations 
  } = useQuery({
    queryKey: ["getVariations", queryId],
    queryFn: () => queryId ? getSavedVariations(queryId) : Promise.resolve([]),
    enabled: !!queryId,
  });

  const { 
    data: identifiers, 
    isLoading: isLoadingIdentifiers 
  } = useQuery({
    queryKey: ["identifiers", identifier],
    queryFn: () => identifier ? getServiceID(identifier) : Promise.resolve([]),
    enabled: !!identifier,
  });

  const handleCheckboxChange = (variation) => {
    setSelectedVariations((prev) => {
      if (prev.some(v => v.variation_code === variation.variation_code)) {
        return prev.filter((item) => item.variation_code !== variation.variation_code);
      } else {
        return [...prev, variation];
      }
    });
  };

  const handleSubmit = async (values) => {
    if (selectedVariations.length === 0) {
      toast.error("Please select at least one variation");
      return;
    }

    setIsSubmitting(true);
    const dataToSave = {
      variations: selectedVariations,
      serviceID: values.provider,
    };

    try {
      await saveData(dataToSave);
      toast.success("Variations saved successfully!");
      setSelectedVariations([]);
      queryClient.invalidateQueries(["getVariations", values.provider]);
    } catch (error) {
      toast.error(error.message || "Error saving variations. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVariation = async (variation_code, serviceID) => {
    if (!serviceID) {
      toast.error("Please select a provider first");
      return;
    }

    setIsToggling(variation_code);
    try {
      await toggleData(variation_code, serviceID);
      toast.success("Variation toggled successfully!");
      queryClient.invalidateQueries(["variations", serviceID]);
      queryClient.invalidateQueries(["getVariations", serviceID]);
    } catch (error) {
      toast.error(error.message || "Error toggling variation. Please try again.");
    } finally {
      setIsToggling(null);
    }
  };

  // Mobile responsive breakpoints
  const isMobile = window.innerWidth < 768;

  return (
    <div className="border border-solid border-gray-200 rounded-md p-4 md:p-6 h-full overflow-y-auto">
      {/* Tabs - Mobile responsive */}
      <div className="mb-4 flex rounded-lg border border-solid border-gray-300 bg-[#F7F9FB] overflow-hidden">
        <button
          className={`flex-1 py-2 px-1 font-medium transition-colors duration-300 text-sm md:text-base ${
            activeTab === "Set"
              ? "text-green-500 bg-white"
              : "text-gray-500 hover:text-gray-800"
          }`}
          onClick={() => handleTabClick("Set")}
        >
          {isMobile ? 'Set' : 'Set Variations'}
        </button>
        <button
          className={`flex-1 py-2 px-1 font-medium transition-colors duration-300 text-sm md:text-base ${
            activeTab === "Update"
              ? "text-green-500 bg-white"
              : "text-gray-500 hover:text-gray-800"
          }`}
          onClick={() => handleTabClick("Update")}
        >
          {isMobile ? 'Update' : 'Update Variation'}
        </button>
      </div>

      {activeTab === "Set" && (
        <Formik
          initialValues={{ provider: "" }}
          onSubmit={handleSubmit}
        >
          {(formik) => {
            const handleProviderChange = (provider) => {
              setQueryId(provider);
              formik.setFieldValue("provider", provider);
              setSelectedVariations([]);
            };

            return (
              <Form className="flex flex-col space-y-4">
                {/* Provider selection */}
                <div className="flex flex-col">
                  <label className="text-[#6d7a98] text-sm md:text-base mb-1">
                    Select Network Provider
                  </label>
                  {isLoadingIdentifiers ? (
                    <div className="flex justify-center py-4">
                      <AiOutlineLoading3Quarters className="animate-spin h-6 w-6 text-green-500" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-2 md:gap-4 border border-solid border-gray-300 py-2 px-1 rounded">
                      {identifiers?.map((provider) => (
                        <button
                          key={provider?.serviceID}
                          type="button"
                          className={`flex flex-col items-center p-1 md:p-2 rounded-lg transition-all ${
                            formik.values.provider === provider?.serviceID
                              ? "bg-green-50 border border-green-200"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => handleProviderChange(provider.serviceID)}
                        >
                          <img
                            src={
                              provider?.serviceID === "mtn"
                                ? mtn
                                : provider?.serviceID === "glo"
                                ? glo
                                : provider?.serviceID === "airtel"
                                ? airtel
                                : provider?.serviceID === "etisalat"
                                ? nineMobile
                                : provider?.image
                            }
                            alt={provider?.serviceID}
                            className="h-8 w-8 md:h-10 md:w-10 object-cover rounded-full"
                          />
                          <span className="text-xs mt-1 text-gray-600 capitalize">
                            {provider?.serviceID}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <ErrorMessage
                    name="provider"
                    component="div"
                    className="text-red-500 text-xs md:text-sm mt-1"
                  />
                </div>

                {/* Variations list */}
                <div className="bg-[#F7F9FB] rounded-md p-2 md:p-4 w-full">
                  {isLoadingVariations ? (
                    <div className="flex justify-center py-8">
                      <AiOutlineLoading3Quarters className="animate-spin h-8 w-8 text-green-500" />
                      <span className="ml-2">Loading variations...</span>
                    </div>
                  ) : variations?.data?.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {variations.data.map((variation) => (
                        <div
                          key={variation.variation_code}
                          className="flex justify-between items-center p-2 md:p-3 border-b border-gray-200 hover:bg-gray-50 transition duration-200"
                        >
                          <label className="flex-1 text-gray-700 text-sm md:text-base">
                            {variation.name}
                          </label>
                          <input
                            type="checkbox"
                            checked={
                              selectedVariations.some(
                                (v) => v.variation_code === variation.variation_code
                              ) || variation.isActive
                            }
                            onChange={() => handleCheckboxChange(variation)}
                            className="form-checkbox h-5 w-5 text-green-500 focus:ring-green-400"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-gray-500 text-center">
                      <AiOutlineExclamationCircle className="h-8 w-8 mb-2" />
                      <p className="text-sm md:text-base">
                        {formik.values.provider 
                          ? "No variations available for this provider." 
                          : "Please select a provider to view variations."}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isSubmitting || !formik.values.provider || selectedVariations.length === 0}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                      Saving...
                    </span>
                  ) : (
                    "Save Variations"
                  )}
                </Button>
              </Form>
            );
          }}
        </Formik>
      )}

      {activeTab === "Update" && (
        <Formik
          initialValues={{ provider: "" }}
          onSubmit={() => {}}
        >
          {(formik) => {
            const handleProviderChange = (provider) => {
              setQueryId(provider);
              formik.setFieldValue("provider", provider);
            };

            return (
              <Form className="flex flex-col space-y-4">
                {/* Provider selection */}
                <div className="flex flex-col">
                  <label className="text-[#6d7a98] text-sm md:text-base mb-1">
                    Select Network Provider
                  </label>
                  {isLoadingIdentifiers ? (
                    <div className="flex justify-center py-4">
                      <AiOutlineLoading3Quarters className="animate-spin h-6 w-6 text-green-500" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-2 md:gap-4 border border-solid border-gray-300 py-2 px-1 rounded">
                      {identifiers?.map((provider) => (
                        <button
                          key={provider?.serviceID}
                          type="button"
                          className={`flex flex-col items-center p-1 md:p-2 rounded-lg transition-all ${
                            formik.values.provider === provider?.serviceID
                              ? "bg-green-50 border border-green-200"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => handleProviderChange(provider.serviceID)}
                        >
                          <img
                            src={
                              provider?.serviceID === "mtn"
                                ? mtn
                                : provider?.serviceID === "glo"
                                ? glo
                                : provider?.serviceID === "airtel"
                                ? airtel
                                : provider?.serviceID === "etisalat"
                                ? nineMobile
                                : provider?.image
                            }
                            alt={provider?.serviceID}
                            className="h-8 w-8 md:h-10 md:w-10 object-cover rounded-full"
                          />
                          <span className="text-xs mt-1 text-gray-600 capitalize">
                            {provider?.serviceID}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved variations list */}
                <div className="bg-[#F7F9FB] rounded-md p-2 md:p-4 w-full">
                  {isLoadingSavedVariations ? (
                    <div className="flex justify-center py-8">
                      <AiOutlineLoading3Quarters className="animate-spin h-8 w-8 text-green-500" />
                      <span className="ml-2">Loading saved variations...</span>
                    </div>
                  ) : getVariations?.data?.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {getVariations.data.map((variation) => (
                        <div
                          key={variation.variation_code}
                          className="flex justify-between items-center p-2 md:p-3 border-b border-gray-200 hover:bg-gray-50 transition duration-200"
                        >
                          <label className="flex-1 text-gray-700 text-sm md:text-base">
                            {variation.name}
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleVariation(variation.variation_code, formik.values.provider)}
                            disabled={isToggling === variation.variation_code}
                            className={`relative h-5 w-10 rounded-full transition-colors focus:outline-none ${
                              variation.isActive ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                                variation.isActive ? 'translate-x-5' : ''
                              } flex items-center justify-center`}
                            >
                              {isToggling === variation.variation_code ? (
                                <AiOutlineLoading3Quarters className="animate-spin h-3 w-3" />
                              ) : variation.isActive ? (
                                <FiCheck className="h-3 w-3 text-green-500" />
                              ) : (
                                <FiX className="h-3 w-3 text-gray-500" />
                              )}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-gray-500 text-center">
                      <AiOutlineExclamationCircle className="h-8 w-8 mb-2" />
                      <p className="text-sm md:text-base">
                        {formik.values.provider 
                          ? "No saved variations found for this provider." 
                          : "Please select a provider to view saved variations."}
                      </p>
                    </div>
                  )}
                </div>
              </Form>
            );
          }}
        </Formik>
      )}
    </div>
  );
};

export default Data;