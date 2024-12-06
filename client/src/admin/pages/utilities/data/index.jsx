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
import { AiOutlineExclamationCircle } from 'react-icons/ai'; // Import an icon

const Data = () => {
  const queryClient = useQueryClient();
  const [identifier, setIdentifier] = useState("data");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queryId, setQueryId] = useState(null);
  const [selectedVariations, setSelectedVariations] = useState([]);
  const [activeTab, setActiveTab] = useState("Set");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "Transactions") {
      setCurrentPage(1);
    } else if (tab === "Set") {
      setSelectedVariations([]);
      setQueryId(null);
    } else if (tab === "Update") {
      setSelectedVariations([]);
      setQueryId(null);
    }
  };

  const { data: variations } = useQuery({
    queryKey: ["variations", queryId],
    queryFn: () =>
      queryId ? getDataVariationCodes(queryId) : Promise.resolve([]),
    enabled: !!queryId,
  });

  const { data: getVariations } = useQuery({
    queryKey: ["getVariations", queryId],
    queryFn: () =>
      queryId ? getSavedVariations(queryId) : Promise.resolve([]),
    enabled: !!queryId,
  });

  const { data: identifiers } = useQuery({
    queryKey: ["identifiers", identifier],
    queryFn: () =>
      identifier ? getServiceID(identifier) : Promise.resolve([]),
    enabled: !!identifier,
  });

  const handleCheckboxChange = (variation) => {
    setSelectedVariations((prev) => {
      if (prev.includes(variation)) {
        return prev.filter((item) => item !== variation);
      } else {
        return [...prev, variation];
      }
    });
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    const dataToSave = {
      variations: selectedVariations,
      serviceID: values.provider,
    };

    try {
      await saveData(dataToSave);
      toast.success("Variations saved successfully!");
    } catch (error) {
      console.error("Error saving variations:", error);
      toast.error("Error saving variations. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVariation = async (variation_code) => {
    try {
      await toggleData(variation_code);
      toast.success("Variation toggled successfully!");

      queryClient.invalidateQueries(["variations", queryId]);
      queryClient.invalidateQueries(["getVariations", queryId]);
    } catch (error) {
      console.error("Error toggling variation:", error);
      toast.error("Error toggling variation. Please try again.");
    }
  };

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 h-full">
      <div className="mb-3 flex rounded-lg border border-solid max-w-xs border-gray-300 bg-[#F7F9FB] py-1 px-1">
        <button
          className={`py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "Set"
              ? "text-green-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("Set")}
        >
          Set Variations
        </button>
        <button
          className={`py-1 px-1 font-medium transition-colors duration-300 ${
            activeTab === "Update"
              ? "text-green-500 bg-white rounded-lg w-40"
              : "text-gray-500 hover:text-gray-800 w-40"
          }`}
          onClick={() => handleTabClick("Update")}
        >
          Update Variation
        </button>
      </div>

      {activeTab === "Set" && (
        <>
          <Formik
            initialValues={{
              provider: "",
            }}
            onSubmit={handleSubmit}
          >
            {(formik) => {
              const handleProviderChange = (provider) => {
                setQueryId(provider);
                formik.setFieldValue("provider", provider);
              };

              return (
                <Form className="flex flex-col space-y-3">
                  <div className="flex flex-col">
                    <label className="text-[#6d7a98]" htmlFor="provider">
                      Select Network Provider
                    </label>
                    <div className="flex justify-evenly space-x-4 border border-solid border-gray-300 py-2">
                      {identifiers?.map((provider) => (
                        <button
                          title={provider?.serviceID}
                          key={provider?.serviceID}
                          type="button"
                          className={`flex justify-center items-center rounded-full h-9 w-9 ${
                            formik.values.provider === provider?.serviceID
                              ? "border-2 border-green-500"
                              : "border-0"
                          }`}
                          onClick={() =>
                            handleProviderChange(provider.serviceID)
                          }
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
                            className="h-8 w-8 object-cover rounded-full"
                          />
                        </button>
                      ))}
                    </div>
                    <ErrorMessage
                      name="provider"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div className="bg-[#F7F9FB] rounded-md p-4 w-full">
                    {variations?.length > 0 ? (
                      variations.map((variation) => (
                        <div
                          key={variation.variation_code}
                          className="flex justify-between items-center p-3 border-b border-gray-200 hover:bg-gray-100 transition duration-200"
                        >
                          <label className="flex-1 text-gray-700 font-medium">
                            {variation.name}
                          </label>
                          <input
                            type="checkbox"
                            checked={
                              selectedVariations.includes(variation) ||
                              variation.isActive
                            }
                            onChange={() => handleCheckboxChange(variation)}
                            className="form-checkbox h-5 w-5 text-green-500 focus:ring-green-400"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center p-4 text-gray-500">
                        <AiOutlineExclamationCircle className="mr-2 h-6 w-6" />
                        No variations available. Please select a provider.
                      </div>
                    )}
                  </div>

                  <Button
                    className="bg-green-600 hover:bg-green-400"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Variations"}
                  </Button>
                </Form>
              );
            }}
          </Formik>
        </>
      )}

      {activeTab === "Update" && (
        <>
          <Formik
            initialValues={{
              provider: "",
            }}
            onSubmit={handleSubmit}
          >
            {(formik) => {
              const handleProviderChange = (provider) => {
                setQueryId(provider);
                formik.setFieldValue("provider", provider);
              };

              return (
                <Form className="flex flex-col space-y-3">
                  <div className="flex flex-col">
                    <label className="text-[#6d7a98]" htmlFor="provider">
                      Select Network Provider
                    </label>
                    <div className="flex justify-evenly space-x-4 border border-solid border-gray-300 py-2">
                      {identifiers?.map((provider) => (
                        <button
                          title={provider?.serviceID}
                          key={provider?.serviceID}
                          type="button"
                          className={`flex justify-center items-center rounded-full h-9 w-9 ${
                            formik.values.provider === provider?.serviceID
                              ? "border-2 border-green-500"
                              : "border-0"
                          }`}
                          onClick={() =>
                            handleProviderChange(provider.serviceID)
                          }
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
                            className="h-8 w-8 object-cover rounded-full"
                          />
                        </button>
                      ))}
                    </div>
                    <ErrorMessage
                      name="provider"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div className="bg-[#F7F9FB] rounded-md p-4 w-full">
                    {getVariations?.length > 0 ? (
                      getVariations.map((variation) => (
                        <div
                          key={variation.variation_code}
                          className="flex justify-between items-center p-3 border-b border-gray-200 hover:bg-gray-100 transition duration-200"
                        >
                          <label className="flex-1 text-gray-700 font-medium">
                            {variation.name}
                          </label>
                          <input
                            type="checkbox"
                            checked={variation.isActive}
                            onChange={() => {
                              toggleVariation(variation.variation_code);
                            }}
                            className="form-checkbox h-5 w-5 text-green-500 focus:ring-green-400"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center p-4 text-gray-500">
                        <AiOutlineExclamationCircle className="mr-2 h-6 w-6" />
                        No saved variations found. Please select a provider.
                      </div>
                    )}
                  </div>
                </Form>
              );
            }}
          </Formik>
        </>
      )}
    </div>
  );
};

export default Data;