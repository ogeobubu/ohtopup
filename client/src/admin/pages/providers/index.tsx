import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  FaEyeSlash
} from "react-icons/fa";
import { useSelector } from "react-redux";
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
    { id: "data-plans", label: "Data Plans", icon: FaNetworkWired },
    { id: "analytics", label: "Analytics", icon: FaHeartbeat },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <FaNetworkWired className="text-yellow-300" />
            Provider Management
            <FaNetworkWired className="text-yellow-300" />
          </h1>
          <p className="text-blue-100 text-lg">
            Manage API providers for data and airtime services
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex justify-center">
          <div className={`flex rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'} p-1`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md"
                    : `${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:bg-gray-100`
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="text-sm" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Plans Tab */}
        {activeTab === "data-plans" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Data Plans from All Providers</h2>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-data-plans"] })}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaHeartbeat className="text-sm" />
                Refresh Data
              </button>
            </div>

            {dataPlansLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading data plans from all providers...</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <FaServer className="text-blue-500 text-2xl" />
                      <div>
                        <p className="text-sm opacity-75">Total Providers</p>
                        <p className="text-2xl font-bold">{dataPlansData?.totalProviders || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <FaNetworkWired className="text-green-500 text-2xl" />
                      <div>
                        <p className="text-sm opacity-75">Total Data Plans</p>
                        <p className="text-2xl font-bold">{dataPlansData?.totalPlans || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <FaCheck className="text-purple-500 text-2xl" />
                      <div>
                        <p className="text-sm opacity-75">Active Plans</p>
                        <p className="text-2xl font-bold">
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
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">3rd Party API Providers</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="text-sm" />
                Add Provider
              </button>
            </div>

            {/* Providers Grid */}
            {providersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading providers...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providersData?.providers?.map((provider) => (
                  <div
                    key={provider._id}
                    className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${
                      provider.isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Provider Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          provider.isActive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                        }`}>
                          {provider.isActive ? (
                            <FaCheck className="text-green-600" />
                          ) : (
                            <FaTimes className="text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{provider.displayName}</h3>
                          <p className="text-sm opacity-75">{provider.name}</p>
                        </div>
                      </div>
                      {provider.isActive && (
                        <FaStar className="text-green-500 text-xl" />
                      )}
                    </div>

                    {/* Provider Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-75">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getHealthStatusColor(provider.healthStatus)}`}>
                          {getHealthStatusIcon(provider.healthStatus)}
                          <span className="ml-1">{provider.healthStatus}</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-75">Response Time</span>
                        <span className="font-semibold">{provider.responseTime}ms</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-75">Success Rate</span>
                        <span className="font-semibold">{provider.successRate}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-75">Total Requests</span>
                        <span className="font-semibold">{provider.totalRequests}</span>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestConnection(provider._id)}
                        disabled={testingConnection === provider._id}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {testingConnection === provider._id ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Testing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <FaPlay className="text-xs" />
                            Test
                          </div>
                        )}
                      </button>

                      {!provider.isActive && (
                        <button
                          onClick={() => handleSetActive(provider._id)}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          <FaCheck className="text-xs" />
                        </button>
                      )}

                      <button
                        onClick={() => setEditingProvider(provider)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <FaEdit className="text-xs" />
                      </button>

                      <button
                        onClick={() => handleDeleteProvider(provider._id)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
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
              <h3 className="text-lg font-semibold mb-4">Airtime Settings</h3>

              <div className="space-y-6">
                {/* General Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">General Settings</h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">Auto Network Detection</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically detect mobile network from phone number
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
                      <h5 className="font-medium">Purchase Limits</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enforce minimum and maximum airtime purchase amounts
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
                      <h5 className="font-medium">Transaction Logging</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Log all airtime transactions for monitoring and auditing
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
                </div>

                {/* Purchase Limits Configuration */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="font-medium text-lg mb-4">Purchase Limits Configuration</h4>

                  {/* Global Limits */}
                  <div className="mb-6">
                    <h5 className="font-medium mb-3">Global Limits</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Minimum Amount (₦)
                        </label>
                        <input
                          type="number"
                          defaultValue="50"
                          min="10"
                          max="1000"
                          className={`w-full px-3 py-2 border rounded-lg ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Maximum Amount (₦)
                        </label>
                        <input
                          type="number"
                          defaultValue="50000"
                          min="1000"
                          max="100000"
                          className={`w-full px-3 py-2 border rounded-lg ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Daily Limit (₦)
                        </label>
                        <input
                          type="number"
                          defaultValue="100000"
                          min="10000"
                          max="1000000"
                          className={`w-full px-3 py-2 border rounded-lg ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Monthly Limit (₦)
                        </label>
                        <input
                          type="number"
                          defaultValue="500000"
                          min="50000"
                          max="5000000"
                          className={`w-full px-3 py-2 border rounded-lg ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Network-Specific Limits */}
                  <div>
                    <h5 className="font-medium mb-3">Network-Specific Limits</h5>
                    <div className="space-y-4">
                      {[
                        { name: 'MTN', key: 'mtn', color: 'blue' },
                        { name: 'Glo', key: 'glo', color: 'green' },
                        { name: 'Airtel', key: 'airtel', color: 'red' },
                        { name: '9mobile', key: '9mobile', color: 'purple' }
                      ].map((network) => (
                        <div key={network.key} className={`p-4 rounded-lg border ${
                          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-lg bg-${network.color}-100 dark:bg-${network.color}-900/20 flex items-center justify-center`}>
                              <span className={`text-${network.color}-600 text-sm font-bold`}>
                                {network.name.charAt(0)}
                              </span>
                            </div>
                            <h6 className="font-medium">{network.name}</h6>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Min Amount (₦)
                              </label>
                              <input
                                type="number"
                                defaultValue="50"
                                min="10"
                                max="1000"
                                className={`w-full px-3 py-2 border rounded-lg ${
                                  isDarkMode
                                    ? 'bg-gray-600 border-gray-500 text-white'
                                    : 'bg-white border-gray-300'
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Max Amount (₦)
                              </label>
                              <input
                                type="number"
                                defaultValue="50000"
                                min="1000"
                                max="100000"
                                className={`w-full px-3 py-2 border rounded-lg ${
                                  isDarkMode
                                    ? 'bg-gray-600 border-gray-500 text-white'
                                    : 'bg-white border-gray-300'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Save Purchase Limits
                    </button>
                  </div>
                </div>
              </div>
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