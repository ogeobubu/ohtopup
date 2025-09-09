import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaPlay,
  FaCheck,
  FaTimes,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaServer,
  FaHeartbeat,
  FaClock,
  FaPercentage,
  FaNetworkWired,
  FaCog,
  FaEye,
  FaEyeSlash,
  FaBolt
} from "react-icons/fa";
import { useSelector } from "react-redux";
import Textfield from "../../../components/ui/forms/input";
import { toast } from "react-toastify";
import {
  getAllProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  setDefaultProvider,
  setActiveProvider,
  testProviderConnection,
  getProviderAnalytics,
  bulkUpdateProviderStatus,
  getAllDataPlans,
  getAllSelectedPlans,
  selectDataPlan,
  deselectDataPlan,
  bulkUpdateSelectedPlans,
  getAirtimeLimits as getLimitsApi,
  updateAirtimeLimits,
  getElectricitySettings,
  updateElectricitySettings,
} from "../../../api";

const ProviderManagement = () => {
  const [activeTab, setActiveTab] = useState("providers");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [showCredentials, setShowCredentials] = useState({});
  const [testingConnection, setTestingConnection] = useState(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: getAllProviders,
    staleTime: 30000,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-provider-analytics"],
    queryFn: getProviderAnalytics,
    staleTime: 60000,
  });

  const { data: dataPlansData, isLoading: dataPlansLoading } = useQuery({
    queryKey: ["admin-data-plans"],
    queryFn: getAllDataPlans,
    staleTime: 300000, // 5 minutes cache
  });

  const { data: selectedPlansData, isLoading: selectedPlansLoading } = useQuery({
    queryKey: ["admin-selected-plans"],
    queryFn: getAllSelectedPlans,
    staleTime: 60000, // 1 minute cache
  });

  const createProviderMutation = useMutation({
    mutationFn: createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      setShowCreateModal(false);
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }) => updateProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      setEditingProvider(null);
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: setActiveProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: testProviderConnection,
    onSuccess: (data, providerId) => {
      setTestingConnection(null);
      // Update the provider data with new health metrics
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      alert(data.testResult.message);
    },
    onError: () => {
      setTestingConnection(null);
      alert("Connection test failed");
    },
  });

  const selectPlanMutation = useMutation({
    mutationFn: selectDataPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-selected-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-data-plans"] });
    },
  });

  const deselectPlanMutation = useMutation({
    mutationFn: ({ planId, providerId }) => deselectDataPlan(planId, providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-selected-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-data-plans"] });
    },
  });

  const bulkSelectMutation = useMutation({
    mutationFn: ({ action, plans }) => bulkUpdateSelectedPlans(action, plans),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-selected-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-data-plans"] });
    },
  });

  // Airtime settings mutations and queries
  const { data: limitsData, isLoading: limitsLoading } = useQuery({
    queryKey: ['airtimeLimits'],
    queryFn: getLimitsApi,
  });

  const updateLimitsMutation = useMutation({
    mutationFn: updateAirtimeLimits,
    onSuccess: (data) => {
      console.log('Update limits mutation success:', data);
      toast.success("Airtime limits updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['airtimeLimits'] });
    },
    onError: (error) => {
      console.error('Update limits mutation error:', error);
      console.error('Update limits mutation error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.message || "Failed to update airtime limits");
    }
  });

  const handleTestConnection = (providerId) => {
    setTestingConnection(providerId);
    testConnectionMutation.mutate(providerId);
  };

  const handleSelectPlan = async (plan, providerData) => {
    try {
      await selectPlanMutation.mutateAsync({
        providerId: providerData.providerId,
        providerName: providerData.providerName,
        planId: plan.planId,
        serviceId: plan.serviceId,
        name: plan.name,
        displayName: plan.name,
        amount: plan.amount,
        dataAmount: plan.dataAmount,
        validity: plan.validity,
        network: plan.network,
        planType: plan.type || "Regular"
      });
      alert("Plan selected successfully!");
    } catch (error) {
      alert(`Failed to select plan: ${error.message}`);
    }
  };

  const handleDeselectPlan = async (planId, providerId) => {
    try {
      await deselectPlanMutation.mutateAsync({ planId, providerId });
      alert("Plan deselected successfully!");
    } catch (error) {
      alert(`Failed to deselect plan: ${error.message}`);
    }
  };

  const isPlanSelected = (planId, providerName) => {
    return selectedPlansData?.selectedPlans?.some(
      selected => selected.planId === planId && selected.providerName === providerName
    );
  };

  const handleSetDefault = (providerId) => {
    if (window.confirm("Are you sure you want to set this as the default provider?")) {
      setDefaultMutation.mutate(providerId);
    }
  };

  const handleSetActive = (providerId) => {
    if (window.confirm("Are you sure you want to activate this provider? This will deactivate all other providers.")) {
      setActiveMutation.mutate(providerId);
    }
  };

  const handleDeleteProvider = (providerId) => {
    if (window.confirm("Are you sure you want to delete this provider? This action cannot be undone.")) {
      deleteProviderMutation.mutate(providerId);
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case "healthy": return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "degraded": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      case "down": return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case "healthy": return <FaCheck className="text-green-600" />;
      case "degraded": return <FaStarHalfAlt className="text-yellow-600" />;
      case "down": return <FaTimes className="text-red-600" />;
      default: return <FaRegStar className="text-gray-600" />;
    }
  };

  const tabs = [
    { id: "providers", label: "3rd Party APIs", icon: FaServer },
    { id: "airtime", label: "Airtime Management", icon: FaNetworkWired },
    { id: "electricity", label: "Electricity Management", icon: FaBolt },
    { id: "data-plans", label: "Data Plans", icon: FaNetworkWired },
    { id: "analytics", label: "Analytics", icon: FaHeartbeat },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-2 md:p-0`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 md:py-8 px-3 md:px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2 md:gap-3">
            <FaNetworkWired className="text-yellow-300 text-lg md:text-xl" />
            Provider Management
            <FaNetworkWired className="text-yellow-300 text-lg md:text-xl" />
          </h1>
          <p className="text-blue-100 text-sm md:text-lg">
            Manage API providers for data and airtime services
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Tab Navigation */}
        <div className="mb-4 md:mb-6 flex justify-center">
          <div className={`flex flex-wrap rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'} p-1 gap-1`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-3 md:px-6 py-2 rounded-md font-medium transition-all duration-300 flex items-center gap-1 md:gap-2 text-xs md:text-sm ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md"
                    : `${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:bg-gray-100`
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="text-xs md:text-sm" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data Plans Tab */}
        {activeTab === "data-plans" && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg md:text-2xl font-bold">Data Plans from All Providers</h2>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-data-plans"] })}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm"
              >
                <FaHeartbeat className="text-xs md:text-sm" />
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>

            {dataPlansLoading ? (
              <div className="text-center py-6 md:py-8">
                <div className="animate-spin rounded-full h-10 md:h-12 w-10 md:w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm md:text-base">Loading data plans from all providers...</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                  <div className={`p-4 md:p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 md:gap-3">
                      <FaServer className="text-blue-500 text-lg md:text-2xl" />
                      <div>
                        <p className="text-xs md:text-sm opacity-75">Total Providers</p>
                        <p className="text-lg md:text-2xl font-bold">{dataPlansData?.totalProviders || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 md:p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 md:gap-3">
                      <FaNetworkWired className="text-green-500 text-lg md:text-2xl" />
                      <div>
                        <p className="text-xs md:text-sm opacity-75">Total Data Plans</p>
                        <p className="text-lg md:text-2xl font-bold">{dataPlansData?.totalPlans || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 md:p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 md:gap-3">
                      <FaCheck className="text-purple-500 text-lg md:text-2xl" />
                      <div>
                        <p className="text-xs md:text-sm opacity-75">Active Plans</p>
                        <p className="text-lg md:text-2xl font-bold">
                          {dataPlansData?.data?.reduce((sum, provider) =>
                            sum + provider.plans.filter(plan => plan.isActive).length, 0) || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Plans by Provider */}
                <div className="space-y-6">
                  {dataPlansData?.data?.map((providerData) => (
                    <div
                      key={providerData.providerName}
                      className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                    >
                      {/* Provider Header */}
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              providerData.isActive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                            }`}>
                              {providerData.isActive ? (
                                <FaCheck className="text-green-600 text-xl" />
                              ) : (
                                <FaTimes className="text-red-600 text-xl" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">{providerData.provider}</h3>
                              <p className="text-sm opacity-75">{providerData.providerName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getHealthStatusColor(providerData.healthStatus)}`}>
                              {getHealthStatusIcon(providerData.healthStatus)}
                              <span className="ml-1">{providerData.healthStatus}</span>
                            </span>
                            <span className="text-sm opacity-75">
                              {providerData.plans.length} plans
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Plans Table */}
                      {providerData.plans.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Plan Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Data Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Validity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Network
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {providerData.plans.map((plan, index) => {
                                const isSelected = isPlanSelected(plan.planId, providerData.providerName);
                                return (
                                  <tr key={`${plan.planId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {plan.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {plan.planId}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                      ₦{plan.amount.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-900 dark:text-white">
                                      {plan.dataAmount}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-900 dark:text-white">
                                      {plan.validity}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-900 dark:text-white">
                                      {plan.network}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      plan.type === 'SME' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                                      plan.type === 'Regular' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                                    }`}>
                                      {plan.type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      plan.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                                    }`}>
                                      {plan.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      {isSelected ? (
                                        <button
                                          onClick={() => handleDeselectPlan(plan.planId, providerData.providerId)}
                                          disabled={deselectPlanMutation.isPending}
                                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                                        >
                                          {deselectPlanMutation.isPending ? 'Removing...' : 'Deselect'}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleSelectPlan(plan, {
                                            providerId: providerData.providerId,
                                            providerName: providerData.providerName
                                          })}
                                          disabled={selectPlanMutation.isPending}
                                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                          {selectPlanMutation.isPending ? 'Adding...' : 'Select'}
                                        </button>
                                      )}
                                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        isSelected ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                                      }`}>
                                        {isSelected ? 'Selected' : 'Available'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <FaNetworkWired className="text-4xl mx-auto mb-4 opacity-50" />
                          <p className="text-gray-600 dark:text-gray-400">
                            {providerData.error ? `Error: ${providerData.error}` : 'No data plans available from this provider'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {dataPlansData?.data?.length === 0 && !dataPlansLoading && (
                  <div className="text-center py-12">
                    <FaNetworkWired className="text-6xl mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">No Data Plans Found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No active providers with data plans were found
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === "providers" && (
          <div className="space-y-4 md:space-y-6">
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg md:text-2xl font-bold">3rd Party API Providers</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm w-full sm:w-auto justify-center"
              >
                <FaPlus className="text-xs md:text-sm" />
                Add Provider
              </button>
            </div>

            {/* Providers Grid */}
            {providersLoading ? (
              <div className="text-center py-6 md:py-8">
                <div className="animate-spin rounded-full h-10 md:h-12 w-10 md:w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm md:text-base">Loading providers...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {providersData?.providers?.map((provider) => (
                  <div
                    key={provider._id}
                    className={`rounded-xl shadow-lg p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${
                      provider.isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Provider Header */}
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={`w-8 md:w-10 h-8 md:h-10 rounded-lg flex items-center justify-center ${
                          provider.isActive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                        }`}>
                          {provider.isActive ? (
                            <FaCheck className="text-green-600 text-sm md:text-base" />
                          ) : (
                            <FaTimes className="text-red-600 text-sm md:text-base" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base md:text-lg font-bold truncate">{provider.displayName}</h3>
                          <p className="text-xs md:text-sm opacity-75 truncate">{provider.name}</p>
                        </div>
                      </div>
                      {provider.isActive && (
                        <FaStar className="text-green-500 text-lg md:text-xl" />
                      )}
                    </div>

                    {/* Provider Details */}
                    <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm opacity-75">Status</span>
                        <span className={`px-1 md:px-2 py-1 rounded-full text-xs font-bold ${getHealthStatusColor(provider.healthStatus)}`}>
                          {getHealthStatusIcon(provider.healthStatus)}
                          <span className="ml-1 hidden sm:inline">{provider.healthStatus}</span>
                          <span className="sm:hidden">{provider.healthStatus.charAt(0).toUpperCase()}</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm opacity-75">Response Time</span>
                        <span className="font-semibold text-sm md:text-base">{provider.responseTime}ms</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm opacity-75">Success Rate</span>
                        <span className="font-semibold text-sm md:text-base">{provider.successRate}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm opacity-75">Total Requests</span>
                        <span className="font-semibold text-sm md:text-base">{provider.totalRequests}</span>
                      </div>
                    </div>

                    {/* Supported Services */}
                    <div className="mb-4">
                      <p className="text-sm opacity-75 mb-2">Supported Services</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.supportedServices?.map((service) => (
                          <span
                            key={service}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 md:gap-2">
                      <button
                        onClick={() => handleTestConnection(provider._id)}
                        disabled={testingConnection === provider._id}
                        className="flex-1 px-2 md:px-3 py-1.5 md:py-2 bg-green-600 text-white text-xs md:text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {testingConnection === provider._id ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className="animate-spin rounded-full h-3 md:h-4 w-3 md:w-4 border-b-2 border-white"></div>
                            <span className="hidden sm:inline">Testing...</span>
                            <span className="sm:hidden">...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <FaPlay className="text-xs" />
                            <span className="hidden sm:inline">Test</span>
                          </div>
                        )}
                      </button>

                      {!provider.isActive && (
                        <button
                          onClick={() => handleSetActive(provider._id)}
                          className="px-2 md:px-3 py-1.5 md:py-2 bg-green-600 text-white text-xs md:text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          <FaCheck className="text-xs" />
                        </button>
                      )}

                      <button
                        onClick={() => setEditingProvider(provider)}
                        className="px-2 md:px-3 py-1.5 md:py-2 bg-blue-600 text-white text-xs md:text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <FaEdit className="text-xs" />
                      </button>

                      <button
                        onClick={() => handleDeleteProvider(provider._id)}
                        className="px-2 md:px-3 py-1.5 md:py-2 bg-red-600 text-white text-xs md:text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {providersData?.providers?.length === 0 && !providersLoading && (
              <div className="text-center py-12">
                <FaServer className="text-6xl mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No Providers Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get started by adding your first API provider
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Provider
                </button>
              </div>
            )}
          </div>
        )}

        {/* Airtime Management Tab */}
        {activeTab === "airtime" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Airtime Management</h2>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-providers"] })}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaHeartbeat className="text-sm" />
                Refresh Data
              </button>
            </div>

            {/* Airtime Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaServer className="text-green-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Active Providers</p>
                    <p className="text-2xl font-bold">
                      {providersData?.providers?.filter(p => p.supportedServices?.includes('airtime') && p.isActive).length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaNetworkWired className="text-blue-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Network Providers</p>
                    <p className="text-2xl font-bold">4</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaPercentage className="text-purple-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Avg Success Rate</p>
                    <p className="text-2xl font-bold">
                      {providersData?.providers?.filter(p => p.supportedServices?.includes('airtime'))
                        .reduce((sum, p, _, arr) => sum + (p.successRate || 0) / arr.length, 0).toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaClock className="text-orange-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Avg Response Time</p>
                    <p className="text-2xl font-bold">
                      {providersData?.providers?.filter(p => p.supportedServices?.includes('airtime'))
                        .reduce((sum, p, _, arr) => sum + (p.responseTime || 0) / arr.length, 0).toFixed(0) || 0}ms
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Airtime Providers Table */}
            <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">Airtime Providers</h3>
                <p className="text-sm opacity-75 mt-1">Providers supporting airtime top-up services</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Networks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Success Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Response Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {providersData?.providers?.filter(provider => provider.supportedServices?.includes('airtime')).map((provider) => (
                      <tr key={provider._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              provider.isActive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                            }`}>
                              {provider.isActive ? (
                                <FaCheck className="text-green-600 text-sm" />
                              ) : (
                                <FaTimes className="text-red-600 text-sm" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {provider.displayName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {provider.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthStatusColor(provider.healthStatus)}`}>
                            {getHealthStatusIcon(provider.healthStatus)}
                            <span className="ml-1">{provider.healthStatus}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded">
                              MTN
                            </span>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs rounded">
                              Glo
                            </span>
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-xs rounded">
                              Airtel
                            </span>
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 text-xs rounded">
                              9mobile
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaPercentage className="text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {provider.successRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaClock className="text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {provider.responseTime}ms
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTestConnection(provider._id)}
                              disabled={testingConnection === provider._id}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {testingConnection === provider._id ? 'Testing...' : 'Test'}
                            </button>
                            <button
                              onClick={() => setEditingProvider(provider)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {providersData?.providers?.filter(provider => provider.supportedServices?.includes('airtime')).length === 0 && (
                <div className="p-6 text-center">
                  <FaNetworkWired className="text-4xl mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">No Airtime Providers</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No providers are currently configured to support airtime services
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Airtime Provider
                  </button>
                </div>
              )}
            </div>

            {/* Airtime Settings */}
            <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-6">Airtime Purchase Settings</h3>

              {limitsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <AirtimeLimitsForm
                  limitsData={limitsData}
                  updateLimitsMutation={updateLimitsMutation}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          </div>
        )}

        {/* Electricity Management Tab */}
        {activeTab === "electricity" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Electricity Management</h2>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-providers"] })}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaHeartbeat className="text-sm" />
                Refresh Data
              </button>
            </div>

            {/* Electricity Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaServer className="text-green-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Active Providers</p>
                    <p className="text-2xl font-bold">
                      {providersData?.providers?.filter(p => p.supportedServices?.includes('electricity') && p.isActive).length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaBolt className="text-yellow-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Electricity Discos</p>
                    <p className="text-2xl font-bold">11</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaPercentage className="text-purple-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Avg Success Rate</p>
                    <p className="text-2xl font-bold">
                      {providersData?.providers?.filter(p => p.supportedServices?.includes('electricity'))
                        .reduce((sum, p, _, arr) => sum + (p.successRate || 0) / arr.length, 0).toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaClock className="text-orange-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Avg Response Time</p>
                    <p className="text-2xl font-bold">
                      {providersData?.providers?.filter(p => p.supportedServices?.includes('electricity'))
                        .reduce((sum, p, _, arr) => sum + (p.responseTime || 0) / arr.length, 0).toFixed(0) || 0}ms
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Electricity Providers Table */}
            <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">Electricity Providers</h3>
                <p className="text-sm opacity-75 mt-1">Providers supporting electricity bill payment services</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Discos Supported
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Success Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Response Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {providersData?.providers?.filter(provider => provider.supportedServices?.includes('electricity')).map((provider) => (
                      <tr key={provider._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              provider.isActive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                            }`}>
                              {provider.isActive ? (
                                <FaCheck className="text-green-600 text-sm" />
                              ) : (
                                <FaTimes className="text-red-600 text-sm" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {provider.displayName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {provider.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthStatusColor(provider.healthStatus)}`}>
                            {getHealthStatusIcon(provider.healthStatus)}
                            <span className="ml-1">{provider.healthStatus}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                              IKEDC
                            </span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded">
                              EEDC
                            </span>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs rounded">
                              AEDC
                            </span>
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 text-xs rounded">
                              +8 more
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaPercentage className="text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {provider.successRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaClock className="text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {provider.responseTime}ms
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTestConnection(provider._id)}
                              disabled={testingConnection === provider._id}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {testingConnection === provider._id ? 'Testing...' : 'Test'}
                            </button>
                            <button
                              onClick={() => setEditingProvider(provider)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {providersData?.providers?.filter(provider => provider.supportedServices?.includes('electricity')).length === 0 && (
                <div className="p-6 text-center">
                  <FaBolt className="text-4xl mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">No Electricity Providers</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No providers are currently configured to support electricity services
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Electricity Provider
                  </button>
                </div>
              )}
            </div>

            {/* Electricity Commission Settings */}
            <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-6">Electricity Commission Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Set commission rates for each electricity distribution company (Disco).
                These rates will be applied to electricity purchases to determine user pricing.
              </p>

              <ElectricityCommissionForm
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* Network Providers Tab */}
        {activeTab === "networks" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Network Providers</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="text-sm" />
                Add Network Provider
              </button>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border border-gray-200 dark:border-gray-700`}>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage individual network providers (MTN, Airtel, etc.) for the active 3rd party API.
                Only providers from the currently active API are shown to users.
              </p>
            </div>

            {/* Network Providers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Placeholder for network providers - will be populated from API */}
              <div className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <FaNetworkWired className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">MTN</h3>
                    <p className="text-sm opacity-75">mtn</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-75">Service Type</span>
                    <span className="font-semibold">Data</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-75">Status</span>
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                      Active
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                    <FaEdit className="text-xs inline mr-1" />
                    Edit
                  </button>
                  <button className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Monitor Tab */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Transaction Monitor</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-providers"] })}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaHeartbeat className="text-sm" />
                  Refresh
                </button>
                <select
                  className={`px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  defaultValue="24h"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>

            {/* Real-time Transaction Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaCheck className="text-green-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Successful Today</p>
                    <p className="text-2xl font-bold text-green-600">1,247</p>
                    <p className="text-xs text-green-600">+12% from yesterday</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaTimes className="text-red-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Failed Today</p>
                    <p className="text-2xl font-bold text-red-600">23</p>
                    <p className="text-xs text-red-600">-5% from yesterday</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaClock className="text-yellow-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">8</p>
                    <p className="text-xs text-gray-500">Being processed</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <FaPercentage className="text-blue-500 text-2xl" />
                  <div>
                    <p className="text-sm opacity-75">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-600">98.2%</p>
                    <p className="text-xs text-green-600">+0.3% from yesterday</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Volume Chart Placeholder */}
            <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-4">Transaction Volume (Last 24 Hours)</h3>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="text-center">
                  <FaHeartbeat className="text-4xl mx-auto mb-2 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Transaction volume chart will be displayed here
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Integration with charting library needed
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Recent Transactions</h3>
                  <div className="flex gap-2">
                    <select
                      className={`px-3 py-1 text-sm border rounded ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      }`}
                      defaultValue="all"
                    >
                      <option value="all">All Types</option>
                      <option value="airtime">Airtime</option>
                      <option value="data">Data</option>
                      <option value="cable">Cable</option>
                      <option value="electricity">Electricity</option>
                    </select>
                    <select
                      className={`px-3 py-1 text-sm border rounded ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      }`}
                      defaultValue="all"
                    >
                      <option value="all">All Status</option>
                      <option value="delivered">Delivered</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Sample transaction data */}
                    {[
                      {
                        id: 'TXN_001234',
                        type: 'Airtime',
                        amount: 1000,
                        recipient: '0803******78',
                        provider: 'VTPass',
                        status: 'delivered',
                        time: '2 minutes ago'
                      },
                      {
                        id: 'TXN_001235',
                        type: 'Data',
                        amount: 2500,
                        recipient: '0814******56',
                        provider: 'Clubkonnect',
                        status: 'pending',
                        time: '5 minutes ago'
                      },
                      {
                        id: 'TXN_001236',
                        type: 'Airtime',
                        amount: 500,
                        recipient: '0908******12',
                        provider: 'VTPass',
                        status: 'delivered',
                        time: '8 minutes ago'
                      },
                      {
                        id: 'TXN_001237',
                        type: 'Cable',
                        amount: 8500,
                        recipient: 'DSTV-12345678',
                        provider: 'VTPass',
                        status: 'failed',
                        time: '12 minutes ago'
                      },
                      {
                        id: 'TXN_001238',
                        type: 'Airtime',
                        amount: 2000,
                        recipient: '0706******34',
                        provider: 'Clubkonnect',
                        status: 'delivered',
                        time: '15 minutes ago'
                      }
                    ].map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            transaction.type === 'Airtime' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                            transaction.type === 'Data' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                            transaction.type === 'Cable' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ₦{transaction.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {transaction.recipient}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {transaction.provider}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            transaction.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.time}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                              View
                            </button>
                            {transaction.status === 'failed' && (
                              <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">
                                Retry
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load More Button */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <button className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  Load More Transactions
                </button>
              </div>
            </div>

            {/* System Health Alerts */}
            <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-4">System Health Alerts</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaCheck className="text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">All Systems Operational</p>
                      <p className="text-sm text-green-600 dark:text-green-400">All providers are responding normally</p>
                    </div>
                  </div>
                  <span className="text-sm text-green-600">2 hours ago</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaClock className="text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">High Transaction Volume</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">Transaction volume is 150% above normal</p>
                    </div>
                  </div>
                  <span className="text-sm text-yellow-600">15 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Provider Analytics</h2>

            {analyticsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
              </div>
            ) : (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <FaServer className="text-blue-500 text-2xl" />
                      <div>
                        <p className="text-sm opacity-75">Total Providers</p>
                        <p className="text-2xl font-bold">{analyticsData?.analytics?.totalProviders || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <FaCheck className="text-green-500 text-2xl" />
                      <div>
                        <p className="text-sm opacity-75">Healthy</p>
                        <p className="text-2xl font-bold text-green-600">{analyticsData?.analytics?.activeProviders || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <FaStarHalfAlt className="text-yellow-500 text-2xl" />
                      <div>
                        <p className="text-sm opacity-75">Degraded</p>
                        <p className="text-2xl font-bold text-yellow-600">{analyticsData?.analytics?.degradedProviders || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <FaTimes className="text-red-500 text-2xl" />
                      <div>
                        <p className="text-sm opacity-75">Down</p>
                        <p className="text-2xl font-bold text-red-600">{analyticsData?.analytics?.downProviders || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provider Performance Table */}
                <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold">Provider Performance</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Provider
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Response Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Success Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Total Requests
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Last Check
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {analyticsData?.analytics?.providers?.map((provider) => (
                          <tr key={provider.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {provider.displayName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {provider.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthStatusColor(provider.healthStatus)}`}>
                                {getHealthStatusIcon(provider.healthStatus)}
                                <span className="ml-1">{provider.healthStatus}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <FaClock className="text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {provider.responseTime}ms
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <FaPercentage className="text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {provider.successRate}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {provider.totalRequests}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {provider.lastHealthCheck ? new Date(provider.lastHealthCheck).toLocaleString() : 'Never'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Provider Settings</h2>

            <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-4">System Configuration</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto Health Monitoring</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically monitor provider health every 5 minutes
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Failover Protection</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically switch to healthy provider when current fails
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Load Balancing</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Distribute requests across multiple healthy providers
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Provider Modal */}
        {(showCreateModal || editingProvider) && (
          <ProviderModal
            provider={editingProvider}
            onSubmit={async (providerData) => {
              try {
                if (editingProvider) {
                  await updateProviderMutation.mutateAsync({
                    id: editingProvider._id,
                    data: providerData
                  });
                } else {
                  await createProviderMutation.mutateAsync(providerData);
                }
              } catch (error) {
                console.error('Error saving provider:', error);
                alert('Failed to save provider. Please try again.');
              }
            }}
            onCancel={() => {
              setShowCreateModal(false);
              setEditingProvider(null);
            }}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
};

// Electricity Commission Form Component
const ElectricityCommissionForm = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('global');

  const formik = useFormik({
    initialValues: {
      global: {
        electricityCommissionRate: 5,
        minAmount: 1000,
        maxAmount: 50000
      },
      discos: {
        ikeja: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Ikeja Electric (IKEDC)' },
        eko: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Eko Electric (EKEDC)' },
        abuja: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Abuja Electric (AEDC)' },
        ibadan: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Ibadan Electric (IBEDC)' },
        enugu: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Enugu Electric (EEDC)' },
        port: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Port Harcourt Electric (PHED)' },
        kano: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Kano Electric (KEDCO)' },
        jos: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Jos Electric (JED)' },
        kaduna: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Kaduna Electric (KAEDCO)' },
        benin: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Benin Electric (BEDC)' },
        yola: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Yola Electric (YED)' }
      }
    },
    validationSchema: Yup.object({
      global: Yup.object({
        electricityCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
        minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
        maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
      }),
      discos: Yup.object({
        ikeja: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        eko: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        abuja: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        ibadan: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        enugu: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        port: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        kano: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        jos: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        kaduna: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        benin: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        }),
        yola: Yup.object({
          commissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(50, "Commission rate cannot exceed 50%").required("Required"),
          minAmount: Yup.number().min(100, "Minimum amount cannot be less than ₦100").max(100000, "Minimum amount cannot exceed ₦100,000").required("Required"),
          maxAmount: Yup.number().min(1000, "Maximum amount cannot be less than ₦1,000").max(500000, "Maximum amount cannot exceed ₦500,000").required("Required")
        })
      })
    }),
    onSubmit: async (values) => {
      try {
        console.log('Electricity commission settings submitted:', values);
        await updateElectricitySettings(values);
        alert('Electricity commission settings saved successfully!');
      } catch (error) {
        console.error('Error saving electricity settings:', error);
        alert('Failed to save electricity commission settings. Please try again.');
      }
    }
  });

  return (
    <>
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('global')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'global'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Global Rate
            </button>
            <button
              onClick={() => setActiveTab('discos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'discos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Disco-Specific Rates
            </button>
          </nav>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {activeTab === 'global' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Global Electricity Commission Rate</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Textfield
                label="Electricity Commission Rate (%)"
                name="global.electricityCommissionRate"
                type="number"
                placeholder="Enter global commission rate (0-50%)"
                value={formik.values.global.electricityCommissionRate}
                onChange={formik.handleChange}
                min="0"
                max="50"
                step="0.1"
                isDarkMode={isDarkMode}
                error={formik.touched.global?.electricityCommissionRate && Boolean(formik.errors.global?.electricityCommissionRate)}
                helperText={formik.touched.global?.electricityCommissionRate && formik.errors.global?.electricityCommissionRate}
              />
              <Textfield
                label="Minimum Amount (₦)"
                name="global.minAmount"
                type="number"
                placeholder="Min amount (100-100,000)"
                value={formik.values.global.minAmount}
                onChange={formik.handleChange}
                min="100"
                max="100000"
                isDarkMode={isDarkMode}
                error={formik.touched.global?.minAmount && Boolean(formik.errors.global?.minAmount)}
                helperText={formik.touched.global?.minAmount && formik.errors.global?.minAmount}
              />
              <Textfield
                label="Maximum Amount (₦)"
                name="global.maxAmount"
                type="number"
                placeholder="Max amount (1,000-500,000)"
                value={formik.values.global.maxAmount}
                onChange={formik.handleChange}
                min="1000"
                max="500000"
                isDarkMode={isDarkMode}
                error={formik.touched.global?.maxAmount && Boolean(formik.errors.global?.maxAmount)}
                helperText={formik.touched.global?.maxAmount && formik.errors.global?.maxAmount}
              />
              <div className="md:col-span-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Global settings applied to all electricity purchases. Disco-specific settings override these global values.
                  Commission rate determines discount percentage. Min/Max amounts set purchase limits.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discos' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Disco-Specific Commission Rates</h3>
            {Object.entries(formik.values.discos).map(([discoKey, settings]) => (
              <div key={discoKey} className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">{settings.displayName}</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Textfield
                    label="Commission Rate (%)"
                    name={`discos.${discoKey}.commissionRate`}
                    type="number"
                    placeholder="Enter commission rate (0-50%)"
                    value={settings.commissionRate}
                    onChange={formik.handleChange}
                    min="0"
                    max="50"
                    step="0.1"
                    isDarkMode={isDarkMode}
                    error={formik.touched.discos?.[discoKey]?.commissionRate && Boolean(formik.errors.discos?.[discoKey]?.commissionRate)}
                    helperText={formik.touched.discos?.[discoKey]?.commissionRate && formik.errors.discos?.[discoKey]?.commissionRate}
                  />
                  <Textfield
                    label="Min Amount (₦)"
                    name={`discos.${discoKey}.minAmount`}
                    type="number"
                    placeholder="Min amount"
                    value={settings.minAmount}
                    onChange={formik.handleChange}
                    min="100"
                    max="100000"
                    isDarkMode={isDarkMode}
                    error={formik.touched.discos?.[discoKey]?.minAmount && Boolean(formik.errors.discos?.[discoKey]?.minAmount)}
                    helperText={formik.touched.discos?.[discoKey]?.minAmount && formik.errors.discos?.[discoKey]?.minAmount}
                  />
                  <Textfield
                    label="Max Amount (₦)"
                    name={`discos.${discoKey}.maxAmount`}
                    type="number"
                    placeholder="Max amount"
                    value={settings.maxAmount}
                    onChange={formik.handleChange}
                    min="1000"
                    max="500000"
                    isDarkMode={isDarkMode}
                    error={formik.touched.discos?.[discoKey]?.maxAmount && Boolean(formik.errors.discos?.[discoKey]?.maxAmount)}
                    helperText={formik.touched.discos?.[discoKey]?.maxAmount && formik.errors.discos?.[discoKey]?.maxAmount}
                  />
                  <div className="flex items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Service ID:</strong> {discoKey === 'ikeja' ? 'ikeja-electric' : `${discoKey}-electric`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              console.log('🧪 TEST BUTTON CLICKED');
              const testData = {
                global: { electricityCommissionRate: 5, minAmount: 1000, maxAmount: 50000 },
                discos: {
                  ikeja: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Ikeja Electric (IKEDC)' },
                  eko: { commissionRate: 4, minAmount: 1000, maxAmount: 50000, displayName: 'Eko Electric (EKEDC)' },
                  abuja: { commissionRate: 6, minAmount: 1000, maxAmount: 50000, displayName: 'Abuja Electric (AEDC)' },
                  ibadan: { commissionRate: 3, minAmount: 1000, maxAmount: 50000, displayName: 'Ibadan Electric (IBEDC)' },
                  enugu: { commissionRate: 4, minAmount: 1000, maxAmount: 50000, displayName: 'Enugu Electric (EEDC)' },
                  port: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Port Harcourt Electric (PHED)' },
                  kano: { commissionRate: 4, minAmount: 1000, maxAmount: 50000, displayName: 'Kano Electric (KEDCO)' },
                  jos: { commissionRate: 3, minAmount: 1000, maxAmount: 50000, displayName: 'Jos Electric (JED)' },
                  kaduna: { commissionRate: 4, minAmount: 1000, maxAmount: 50000, displayName: 'Kaduna Electric (KAEDCO)' },
                  benin: { commissionRate: 5, minAmount: 1000, maxAmount: 50000, displayName: 'Benin Electric (BEDC)' },
                  yola: { commissionRate: 4, minAmount: 1000, maxAmount: 50000, displayName: 'Yola Electric (YED)' }
                }
              };
              console.log('Setting test data:', testData);
              formik.setValues(testData);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Load Test Data
          </button>

          <button
            type="submit"
            disabled={!formik.isValid}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Save Commission Settings
          </button>
        </div>
      </form>
    </>
  );
};

// Airtime Limits Form Component
const AirtimeLimitsForm = ({ limitsData, updateLimitsMutation, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('global');

  const formik = useFormik({
    initialValues: {
      global: {
        minAmount: 50,
        maxAmount: 50000,
        dailyLimit: 100000,
        monthlyLimit: 500000,
        airtimeCommissionRate: 0,
        dataCommissionRate: 0
      },
      networks: {
        mtn: { minAmount: 50, maxAmount: 50000, airtimeCommissionRate: 0, dataCommissionRate: 0 },
        glo: { minAmount: 50, maxAmount: 50000, airtimeCommissionRate: 0, dataCommissionRate: 0 },
        airtel: { minAmount: 50, maxAmount: 50000, airtimeCommissionRate: 0, dataCommissionRate: 0 },
        '9mobile': { minAmount: 50, maxAmount: 50000, airtimeCommissionRate: 0, dataCommissionRate: 0 }
      }
    },
    validationSchema: Yup.object({
      global: Yup.object({
        minAmount: Yup.number().min(1, "Minimum amount must be at least 1").required("Required"),
        maxAmount: Yup.number().min(Yup.ref('minAmount'), "Max amount must be greater than min amount").required("Required"),
        dailyLimit: Yup.number().min(1, "Daily limit must be at least 1").required("Required"),
        monthlyLimit: Yup.number().min(Yup.ref('dailyLimit'), "Monthly limit must be greater than daily limit").required("Required"),
        airtimeCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required"),
        dataCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required")
      }),
      networks: Yup.object({
        mtn: Yup.object({
          minAmount: Yup.number().min(1, "Minimum amount must be at least 1").required("Required"),
          maxAmount: Yup.number().min(Yup.ref('minAmount'), "Max amount must be greater than min amount").required("Required"),
          airtimeCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required"),
          dataCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required")
        }),
        glo: Yup.object({
          minAmount: Yup.number().min(1, "Minimum amount must be at least 1").required("Required"),
          maxAmount: Yup.number().min(Yup.ref('minAmount'), "Max amount must be greater than min amount").required("Required"),
          airtimeCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required"),
          dataCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required")
        }),
        airtel: Yup.object({
          minAmount: Yup.number().min(1, "Minimum amount must be at least 1").required("Required"),
          maxAmount: Yup.number().min(Yup.ref('minAmount'), "Max amount must be greater than min amount").required("Required"),
          airtimeCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required"),
          dataCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required")
        }),
        '9mobile': Yup.object({
          minAmount: Yup.number().min(1, "Minimum amount must be at least 1").required("Required"),
          maxAmount: Yup.number().min(Yup.ref('minAmount'), "Max amount must be greater than min amount").required("Required"),
          airtimeCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required"),
          dataCommissionRate: Yup.number().min(0, "Commission rate cannot be negative").max(100, "Commission rate cannot exceed 100%").required("Required")
        })
      })
    }),
    onSubmit: (values) => {
      console.log('🚀 FORM SUBMISSION STARTED');
      console.log('Form submission - values being sent:', values);
      console.log('Form submission - JSON stringified:', JSON.stringify(values, null, 2));

      // Check if form is valid
      console.log('Form is valid:', formik.isValid);
      console.log('Form errors:', formik.errors);
      console.log('Form touched:', formik.touched);

      updateLimitsMutation.mutate(values);
    }
  });

  useEffect(() => {
    if (limitsData?.limits) {
      formik.setValues(limitsData.limits);
    }
  }, [limitsData]);

  const networkNames = {
    mtn: 'MTN',
    glo: 'Glo',
    airtel: 'Airtel',
    '9mobile': '9Mobile'
  };

  return (
    <>
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('global')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'global'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Global Limits
            </button>
            <button
              onClick={() => setActiveTab('networks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'networks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Network-Specific Limits
            </button>
          </nav>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {activeTab === 'global' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Global Purchase Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textfield
                label="Minimum Amount (₦)"
                name="global.minAmount"
                type="number"
                placeholder="Enter minimum amount"
                value={formik.values.global.minAmount}
                onChange={formik.handleChange}
                min="1"
                isDarkMode={isDarkMode}
                error={formik.touched.global?.minAmount && Boolean(formik.errors.global?.minAmount)}
                helperText={formik.touched.global?.minAmount && formik.errors.global?.minAmount}
              />
              <Textfield
                label="Maximum Amount (₦)"
                name="global.maxAmount"
                type="number"
                placeholder="Enter maximum amount"
                value={formik.values.global.maxAmount}
                onChange={formik.handleChange}
                min="1"
                isDarkMode={isDarkMode}
                error={formik.touched.global?.maxAmount && Boolean(formik.errors.global?.maxAmount)}
                helperText={formik.touched.global?.maxAmount && formik.errors.global?.maxAmount}
              />
              <Textfield
                label="Daily Limit (₦)"
                name="global.dailyLimit"
                type="number"
                placeholder="Enter daily limit"
                value={formik.values.global.dailyLimit}
                onChange={formik.handleChange}
                min="1"
                isDarkMode={isDarkMode}
                error={formik.touched.global?.dailyLimit && Boolean(formik.errors.global?.dailyLimit)}
                helperText={formik.touched.global?.dailyLimit && formik.errors.global?.dailyLimit}
              />
              <Textfield
                label="Monthly Limit (₦)"
                name="global.monthlyLimit"
                type="number"
                placeholder="Enter monthly limit"
                value={formik.values.global.monthlyLimit}
                onChange={formik.handleChange}
                min="1"
                isDarkMode={isDarkMode}
                error={formik.touched.global?.monthlyLimit && Boolean(formik.errors.global?.monthlyLimit)}
                helperText={formik.touched.global?.monthlyLimit && formik.errors.global?.monthlyLimit}
              />
              <Textfield
                label="Airtime Commission Rate (%)"
                name="global.airtimeCommissionRate"
                type="number"
                placeholder="Enter airtime commission rate (0-100%)"
                value={formik.values.global.airtimeCommissionRate}
                onChange={formik.handleChange}
                min="0"
                isDarkMode={isDarkMode}
                error={formik.touched.global?.airtimeCommissionRate && Boolean(formik.errors.global?.airtimeCommissionRate)}
                helperText={formik.touched.global?.airtimeCommissionRate && formik.errors.global?.airtimeCommissionRate}
              />
              <Textfield
                label="Data Commission Rate (%)"
                name="global.dataCommissionRate"
                type="number"
                placeholder="Enter data commission rate (0-100%)"
                value={formik.values.global.dataCommissionRate}
                onChange={formik.handleChange}
                min="0"
                isDarkMode={isDarkMode}
                error={formik.touched.global?.dataCommissionRate && Boolean(formik.errors.global?.dataCommissionRate)}
                helperText={formik.touched.global?.dataCommissionRate && formik.errors.global?.dataCommissionRate}
              />
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Commission rates applied to purchases. Users will pay less than the service amount.
                  Example: 5% commission on ₦100 service = user pays ₦95, saves ₦5.
                  Network-specific rates override global rates.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'networks' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Network-Specific Limits</h3>
            {Object.entries(formik.values.networks).map(([network, settings]) => (
              <div key={network} className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">{networkNames[network]}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Textfield
                    label="Minimum Amount (₦)"
                    name={`networks.${network}.minAmount`}
                    type="number"
                    placeholder="Enter minimum amount"
                    value={settings.minAmount}
                    onChange={formik.handleChange}
                    min="1"
                    isDarkMode={isDarkMode}
                    error={formik.touched.networks?.[network]?.minAmount && Boolean(formik.errors.networks?.[network]?.minAmount)}
                    helperText={formik.touched.networks?.[network]?.minAmount && formik.errors.networks?.[network]?.minAmount}
                  />
                  <Textfield
                    label="Maximum Amount (₦)"
                    name={`networks.${network}.maxAmount`}
                    type="number"
                    placeholder="Enter maximum amount"
                    value={settings.maxAmount}
                    onChange={formik.handleChange}
                    min="1"
                    isDarkMode={isDarkMode}
                    error={formik.touched.networks?.[network]?.maxAmount && Boolean(formik.errors.networks?.[network]?.maxAmount)}
                    helperText={formik.touched.networks?.[network]?.maxAmount && formik.errors.networks?.[network]?.maxAmount}
                  />
                  <Textfield
                    label="Airtime Commission Rate (%)"
                    name={`networks.${network}.airtimeCommissionRate`}
                    type="number"
                    placeholder="Enter airtime commission rate (0-100%)"
                    value={settings.airtimeCommissionRate}
                    onChange={formik.handleChange}
                    min="0"
                    isDarkMode={isDarkMode}
                    error={formik.touched.networks?.[network]?.airtimeCommissionRate && Boolean(formik.errors.networks?.[network]?.airtimeCommissionRate)}
                    helperText={formik.touched.networks?.[network]?.airtimeCommissionRate && formik.errors.networks?.[network]?.airtimeCommissionRate}
                  />
                  <Textfield
                    label="Data Commission Rate (%)"
                    name={`networks.${network}.dataCommissionRate`}
                    type="number"
                    placeholder="Enter data commission rate (0-100%)"
                    value={settings.dataCommissionRate}
                    onChange={formik.handleChange}
                    min="0"
                    isDarkMode={isDarkMode}
                    error={formik.touched.networks?.[network]?.dataCommissionRate && Boolean(formik.errors.networks?.[network]?.dataCommissionRate)}
                    helperText={formik.touched.networks?.[network]?.dataCommissionRate && formik.errors.networks?.[network]?.dataCommissionRate}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Test button to bypass validation */}
          <button
            type="button"
            onClick={() => {
              console.log('🧪 TEST BUTTON CLICKED');
              const testData = {
                global: {
                  minAmount: 50,
                  maxAmount: 50000,
                  dailyLimit: 100000,
                  monthlyLimit: 500000,
                  airtimeCommissionRate: 5,
                  dataCommissionRate: 3
                },
                networks: {
                  mtn: { minAmount: 50, maxAmount: 50000, airtimeCommissionRate: 5, dataCommissionRate: 3 },
                  glo: { minAmount: 50, maxAmount: 50000, airtimeCommissionRate: 4, dataCommissionRate: 2 },
                  airtel: { minAmount: 50, maxAmount: 50000, airtimeCommissionRate: 6, dataCommissionRate: 4 },
                  '9mobile': { minAmount: 50, maxAmount: 50000, airtimeCommissionRate: 7, dataCommissionRate: 5 }
                }
              };
              console.log('Sending test data:', testData);
              updateLimitsMutation.mutate(testData);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Test API Call
          </button>

          <button
            type="button"
            disabled={!formik.isValid || updateLimitsMutation.isPending}
            onClick={() => {
              console.log('🔥 UPDATE BUTTON CLICKED');
              console.log('Form is valid:', formik.isValid);
              console.log('Form errors:', formik.errors);
              console.log('Form values:', formik.values);
              console.log('Form touched:', formik.touched);

              if (formik.isValid) {
                console.log('Submitting form...');
                formik.handleSubmit();
              } else {
                console.log('Form is not valid, not submitting');
                toast.error('Please fix the form errors before submitting');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            {updateLimitsMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </div>
            ) : (
              'Update Settings'
            )}
          </button>
        </div>
      </form>
    </>
  );
};

// Provider Modal Component
const ProviderModal = ({ provider, onSubmit, onCancel, isDarkMode }) => {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    displayName: provider?.displayName || '',
    description: provider?.description || '',
    isActive: provider?.isActive ?? true,
    isDefault: provider?.isDefault ?? false,
    credentials: {
      userId: provider?.credentials?.userId || '',
      apiKey: provider?.credentials?.apiKey || '',
      secretKey: provider?.credentials?.secretKey || '',
      publicKey: provider?.credentials?.publicKey || '',
    },
    baseUrl: provider?.baseUrl || '',
    supportedServices: provider?.supportedServices || [],
    rateLimits: {
      requestsPerMinute: provider?.rateLimits?.requestsPerMinute || 60,
      requestsPerHour: provider?.rateLimits?.requestsPerHour || 1000,
    }
  });

  const [showCredentials, setShowCredentials] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.displayName || !formData.credentials.userId || !formData.credentials.apiKey) {
      alert('Please fill in all required fields');
      return;
    }

    // Set default endpoints based on provider type
    let endpoints = {};
    if (formData.name === 'vtpass') {
      endpoints = {
        walletBalance: '/api/balance',
        dataPurchase: '/api/pay',
        airtimePurchase: '/api/pay',
        cablePurchase: '/api/pay',
        electricityPurchase: '/api/pay',
        queryTransaction: '/api/requery',
        dataPlans: '/api/service-variations',
        serviceVariations: '/api/service-variations'
      };
      if (!formData.baseUrl) {
        formData.baseUrl = 'https://api.vtpass.com';
      }
    } else if (formData.name === 'clubkonnect') {
      endpoints = {
        walletBalance: '/APIWalletBalanceV1.asp',
        dataPurchase: '/APIDatabundleV1.asp',
        airtimePurchase: '/APIAirtimeV1.asp',
        queryTransaction: '/APIQueryV1.asp',
        cancelTransaction: '/APICancelV1.asp'
      };
      if (!formData.baseUrl) {
        formData.baseUrl = 'https://www.nellobytesystems.com';
      }
    }

    const submitData = {
      ...formData,
      endpoints,
      supportedServices: formData.supportedServices.length > 0 ? formData.supportedServices : ['data']
    };

    onSubmit(submitData);
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      supportedServices: prev.supportedServices.includes(service)
        ? prev.supportedServices.filter(s => s !== service)
        : [...prev.supportedServices, service]
    }));
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'credentials') {
        setFormData(prev => ({
          ...prev,
          credentials: {
            ...prev.credentials,
            [child]: value
          }
        }));
      } else if (parent === 'rateLimits') {
        setFormData(prev => ({
          ...prev,
          rateLimits: {
            ...prev.rateLimits,
            [child]: parseInt(value) || 0
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {provider ? 'Edit Provider' : 'Add New Provider'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Provider Name *
              </label>
              <select
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
                required
              >
                <option value="">Select Provider</option>
                <option value="vtpass">VTPass</option>
                <option value="clubkonnect">Clubkonnect</option>
                <option value="custom">Custom Provider</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
                placeholder="e.g., VTPass, Clubkonnect"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300'
              }`}
              rows={3}
              placeholder="Brief description of the provider"
            />
          </div>

          {/* API Credentials */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">API Credentials</h3>
              <button
                type="button"
                onClick={() => setShowCredentials(!showCredentials)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded"
              >
                {showCredentials ? <FaEyeSlash /> : <FaEye />}
                {showCredentials ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  User ID *
                </label>
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={formData.credentials.userId}
                  onChange={(e) => handleChange('credentials.userId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="API User ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  API Key *
                </label>
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={formData.credentials.apiKey}
                  onChange={(e) => handleChange('credentials.apiKey', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="API Key"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Secret Key
                </label>
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={formData.credentials.secretKey}
                  onChange={(e) => handleChange('credentials.secretKey', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="Secret Key (if required)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Base URL
                </label>
                <input
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => handleChange('baseUrl', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="https://api.provider.com"
                />
              </div>
            </div>
          </div>

          {/* Supported Services */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Supported Services</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['data', 'airtime', 'cable', 'electricity'].map((service) => (
                <label key={service} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.supportedServices.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="mr-2"
                  />
                  <span className="capitalize">{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rate Limits */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Rate Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Requests per Minute
                </label>
                <input
                  type="number"
                  value={formData.rateLimits.requestsPerMinute}
                  onChange={(e) => handleChange('rateLimits.requestsPerMinute', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Requests per Hour
                </label>
                <input
                  type="number"
                  value={formData.rateLimits.requestsPerHour}
                  onChange={(e) => handleChange('rateLimits.requestsPerHour', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  min="1"
                  max="10000"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="mr-3"
                />
                <span>Active (Provider can be used for transactions)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => handleChange('isDefault', e.target.checked)}
                  className="mr-3"
                />
                <span>Default Provider (Used when no specific provider requested)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {provider ? 'Update Provider' : 'Add Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderManagement;
