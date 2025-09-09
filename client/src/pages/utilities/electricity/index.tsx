import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { getWallet, getUser, getServiceIDElectricity, getElectricityName, purchaseElectricity, getElectricityCommissionRate, getElectricityLimits, requeryElectricityTransaction, getAvailableDiscos } from "../../../api";
import Modal from "../../../admin/components/modal";
import { formatNairaAmount } from "../../../utils";
import { FaBolt, FaCheck, FaCreditCard, FaChevronRight, FaUser, FaMapMarkerAlt } from "react-icons/fa";

const Loader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
    <p className="mt-3 text-gray-600 dark:text-gray-400">Loading electricity services...</p>
  </div>
);

const ElectricityPurchase = ({ isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDisco, setSelectedDisco] = useState('');
  const [selectedMeterType, setSelectedMeterType] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Disco, 2: Meter Type, 3: Meter Details, 4: Amount, 5: Phone, 6: Confirm
  const [discoReset, setDiscoReset] = useState(false); // Track if disco was reset

  // Fetch wallet and providers
  const { data: walletData, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
  });

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  const { data: providers, isLoading: isProvidersLoading } = useQuery({
    queryKey: ['providers', 'electricity'],
    queryFn: getAvailableDiscos,
  });

  const [isConfirming, setIsConfirming] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [commissionRate, setCommissionRate] = useState(0);
  const [savings, setSavings] = useState(0);
  const [minAmount, setMinAmount] = useState(1000);
  const [maxAmount, setMaxAmount] = useState(50000);
  const [isRequerying, setIsRequerying] = useState(false);

  // Initialize phone number
  useEffect(() => {
    if (user?.phoneNumber && !phoneNumber) {
      setPhoneNumber(user.phoneNumber);
    }
  }, [user, phoneNumber]);

  // Load commission rate and limits for selected disco
  const loadDiscoSettings = async (disco) => {
    try {
      const [commissionResult, limitsResult] = await Promise.all([
        getElectricityCommissionRate(disco),
        getElectricityLimits(disco)
      ]);

      setCommissionRate(commissionResult.commissionRate || 0);
      setMinAmount(limitsResult.minAmount || 1000);
      setMaxAmount(limitsResult.maxAmount || 50000);
    } catch (error) {
      console.error('Error loading disco settings:', error);
      // Use defaults if API fails
      setCommissionRate(0);
      setMinAmount(1000);
      setMaxAmount(50000);
    }
  };

  // Calculate savings based on amount and commission rate
  const calculateSavings = (amount, rate) => {
    if (!amount || !rate) return 0;
    return (parseFloat(amount) * rate) / 100;
  };

  // Handle disco change - reset dependent data
  const handleDiscoChange = async (disco) => {
    // If changing to a different disco, reset dependent selections
    if (selectedDisco && selectedDisco !== disco) {
      setSelectedMeterType('');
      setMeterNumber('');
      setSelectedAmount('');
      setCustomerName('');
      setCustomerAddress('');
      setPhoneNumber('');
      setCurrentStep(2); // Reset to meter type selection step
      setDiscoReset(true); // Mark that disco was reset
    } else {
      setDiscoReset(false); // Clear reset flag if same disco
    }

    setSelectedDisco(disco);

    // Load settings for the selected disco
    await loadDiscoSettings(disco);
  };

  // Handle meter type change
  const handleMeterTypeChange = (meterType) => {
    setSelectedMeterType(meterType);
    setMeterNumber('');
    setCustomerName('');
    setCustomerAddress('');
  };

  // Handle meter number validation
  const validateMeterNumber = async (meterNum) => {
    if (meterNum.length >= 10 && selectedDisco && selectedMeterType) {
      try {
        const response = await getElectricityName(selectedDisco, meterNum, selectedMeterType);
        setCustomerName(response.data.Customer_Name);
        setCustomerAddress(response.data.Address);

        // Show notification if using mock data
        if (response.mock) {
          console.log('ℹ️ Using test data - VTPass service unavailable');
        }

        return true;
      } catch (error) {
        console.error('Meter validation error:', error);
        setCustomerName('');
        setCustomerAddress('');

        // Handle specific error types
        if (error.response?.data?.error === 'SERVICE_UNAVAILABLE') {
          console.warn('Electricity service temporarily unavailable');
        } else if (error.response?.data?.error === 'INVALID_REQUEST') {
          console.warn('Invalid meter number format');
        }

        return false;
      }
    }
    return false;
  };

  const confirmPurchase = async () => {
    try {
      setIsConfirming(true);

      const purchaseData = {
        serviceID: selectedDisco,
        billersCode: meterNumber,
        variation_code: selectedMeterType,
        amount: parseInt(selectedAmount),
        phone: phoneNumber,
      };

      const response = await purchaseElectricity(purchaseData);
      setPurchaseResult(response);

      // Show success modal
      setShowSuccessModal(true);

      // Reset form after a delay
      setTimeout(() => {
        setIsModalOpen(false);
        setShowSuccessModal(false);
        setPurchaseResult(null);
        // Reset form
        setSelectedDisco('');
        setSelectedMeterType('');
        setMeterNumber('');
        setSelectedAmount('');
        setPhoneNumber('');
        setCustomerName('');
        setCustomerAddress('');
        setCurrentStep(1);
      }, 5000);

    } catch (error) {
      console.error('Purchase error:', error);
      // Handle error - you might want to show an error message
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRequeryTransaction = async () => {
    if (!purchaseResult?.transaction?.requestId) return;

    try {
      setIsRequerying(true);
      const response = await requeryElectricityTransaction(purchaseResult.transaction.requestId);

      // Update the purchase result with the new status
      setPurchaseResult(prev => ({
        ...prev,
        transaction: {
          ...prev.transaction,
          status: response.transaction.status
        }
      }));

      console.log('Transaction status updated:', response.transaction.status);
    } catch (error) {
      console.error('Requery error:', error);
    } finally {
      setIsRequerying(false);
    }
  };

  const isLoading = isWalletLoading || isProvidersLoading || isUserLoading;

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  return (
    <div className="border border-solid border-gray-200 rounded-xl p-4 md:p-8 h-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
          <FaBolt className="text-white text-2xl md:text-3xl" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Pay Electricity Bill</h3>
        <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6">Pay your electricity bills instantly</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 md:py-4 md:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
        >
          Start Payment
        </button>
      </div>

      <Modal
        isDarkMode={isDarkMode}
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        size="lg"
        showCloseButton={false}
        stickyHeader={
          <div className="bg-white">
            {/* Progress Header */}
            <div className="px-3 md:px-4 py-2 md:py-3">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                    <FaBolt className="text-white text-xs md:text-sm" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-bold text-gray-900">Pay Electricity Bill</h2>
                    <p className="text-xs text-gray-500">Quick and easy electricity payment</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-gray-500 text-xs md:text-sm">×</span>
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-1">
                {[
                  { step: 1, label: 'Disco' },
                  { step: 2, label: 'Meter' },
                  { step: 3, label: 'Details' },
                  { step: 4, label: 'Amount' },
                  { step: 5, label: 'Phone' },
                  { step: 6, label: 'Confirm' }
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep >= step
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step ? <FaCheck className="text-xs" /> : step}
                    </div>
                    <span className={`ml-1 text-xs font-medium ${
                      currentStep >= step ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {label}
                    </span>
                    {step < 6 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step ? 'bg-yellow-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Balance Card */}
            <div className="px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-yellow-50 to-orange-50">
              <div className="bg-white rounded-lg p-2 md:p-3 shadow-sm border border-yellow-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                      <FaCreditCard className="text-white text-xs md:text-sm" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Available Balance</p>
                      <p className="text-lg md:text-xl font-bold text-gray-900">
                        {formatNairaAmount(walletData?.balance || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <p className="text-xs text-gray-500 mt-0.5">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      >
        {isLoading ? (
          <Loader />
        ) : (
          <div className="flex flex-col bg-white rounded-2xl">
            {/* Step 1: Disco Selection */}
            {currentStep === 1 && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-6 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Choose Your Disco</h3>
                  <p className="text-sm text-gray-600">Select your electricity distribution company</p>
                </div>
                <div className="grid grid-cols-1 gap-2 md:gap-3 max-w-sm mx-auto">
                  {providers?.discos?.map(disco => (
                    <button
                      key={disco.serviceID}
                      onClick={() => {
                        handleDiscoChange(disco.serviceID);
                      }}
                      className={`p-3 md:p-4 bg-white border-2 rounded-xl transition-all duration-200 hover:shadow-md active:scale-95 ${
                        selectedDisco === disco.serviceID
                          ? 'border-yellow-500 bg-yellow-50 shadow-md'
                          : 'border-gray-200 hover:border-yellow-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1 md:mb-2">
                          <FaBolt className="text-yellow-600 text-base md:text-lg" />
                        </div>
                        <div className="text-base md:text-lg font-bold text-gray-900 mb-1">
                          {disco.displayName}
                        </div>
                        <div className="text-xs text-gray-600">
                          Commission: {disco.commissionRate}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-4 md:mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      if (selectedDisco) {
                        setCurrentStep(2);
                        setDiscoReset(false);
                      }
                    }}
                    disabled={!selectedDisco}
                    className="px-4 md:px-6 py-2 md:py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>

                {/* Disco Change Notification */}
                {selectedDisco && (
                  <div className="mt-3 space-y-3">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                          <FaCheck className="text-yellow-600 text-xs" />
                        </div>
                        <div className="text-sm text-yellow-800">
                          <span className="font-medium">{providers?.discos?.find(d => d.serviceID === selectedDisco)?.displayName || selectedDisco?.toUpperCase()}</span> selected.
                          {discoReset && (
                            <span className="text-orange-600 ml-1 block mt-1">
                              ⚠️ Previous selections have been reset.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount Limits for Selected Disco */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaBolt className="text-blue-600 text-sm" />
                        <span className="text-sm font-medium text-blue-800">Transaction Limits</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-2 rounded border">
                          <span className="text-blue-700 font-medium block">Minimum</span>
                          <span className="text-blue-900 font-bold text-lg">₦{minAmount.toLocaleString()}</span>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-blue-700 font-medium block">Maximum</span>
                          <span className="text-blue-900 font-bold text-lg">₦{maxAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        These limits are configured by your electricity provider for secure transactions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Meter Type Selection */}
            {currentStep === 2 && selectedDisco && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-6 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Meter Type</h3>
                  <p className="text-sm text-gray-600">
                    Select your meter type for {providers?.discos?.find(d => d.serviceID === selectedDisco)?.displayName || selectedDisco?.toUpperCase()}
                  </p>
                </div>

                {/* Disco Reset Notification */}
                {discoReset && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-xs">⚠️</span>
                      </div>
                      <div className="text-sm text-orange-800">
                        <span className="font-medium">Disco changed</span> - Please select your meter type for {providers?.discos?.find(d => d.serviceID === selectedDisco)?.displayName || selectedDisco?.toUpperCase()}.
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-w-sm mx-auto space-y-2 md:space-y-3">
                  <button
                    onClick={() => {
                      handleMeterTypeChange('prepaid');
                      setCurrentStep(3);
                    }}
                    className={`w-full p-3 md:p-4 bg-white border-2 rounded-xl transition-all duration-200 hover:shadow-md ${
                      selectedMeterType === 'prepaid'
                        ? 'border-yellow-500 bg-yellow-50 shadow-md'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <FaBolt className="text-yellow-600 text-base md:text-lg" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-gray-900 text-sm md:text-base">Prepaid Meter</div>
                        <div className="text-gray-600 text-xs md:text-sm">Buy electricity token</div>
                      </div>
                      <div className="text-yellow-600">
                        <FaChevronRight className="text-base md:text-lg" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleMeterTypeChange('postpaid');
                      setCurrentStep(3);
                    }}
                    className={`w-full p-3 md:p-4 bg-white border-2 rounded-xl transition-all duration-200 hover:shadow-md ${
                      selectedMeterType === 'postpaid'
                        ? 'border-yellow-500 bg-yellow-50 shadow-md'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaBolt className="text-blue-600 text-base md:text-lg" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-gray-900 text-sm md:text-base">Postpaid Meter</div>
                        <div className="text-gray-600 text-xs md:text-sm">Pay outstanding bill</div>
                      </div>
                      <div className="text-blue-600">
                        <FaChevronRight className="text-base md:text-lg" />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Navigation Buttons */}
                <div className="mt-3 md:mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Previous
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Meter Details */}
            {currentStep === 3 && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-6 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Meter Details</h3>
                  <p className="text-sm text-gray-600">Enter your meter number</p>
                </div>

                <div className="max-w-sm mx-auto">
                  <label className="block text-sm md:text-base font-semibold text-gray-900 mb-2">
                    Meter Number
                  </label>
                  <input
                    type="text"
                    value={meterNumber}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setMeterNumber(value);
                      await validateMeterNumber(value);
                    }}
                    className="w-full px-3 py-2 md:py-3 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium bg-white focus:border-yellow-500 focus:outline-none transition-colors"
                    placeholder="Enter meter number"
                  />

                  {/* Amount Limits Info - Early visibility */}
                  {selectedDisco && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FaBolt className="text-blue-600 text-sm" />
                        <span className="text-sm font-medium text-blue-800">Purchase Limits</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Min Amount:</span>
                          <p className="text-blue-800 font-semibold">₦{minAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Max Amount:</span>
                          <p className="text-blue-800 font-semibold">₦{maxAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        These limits ensure secure and compliant transactions.
                      </p>
                    </div>
                  )}

                  {/* Customer Details Display */}
                  {customerName && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Customer Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-500 text-sm" />
                          <span className="text-sm text-gray-700">{customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-gray-500 text-sm" />
                          <span className="text-sm text-gray-700">{customerAddress}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-3 md:mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (meterNumber && customerName) {
                        setCurrentStep(4);
                      }
                    }}
                    disabled={!meterNumber || !customerName}
                    className="px-3 md:px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Amount Selection */}
            {currentStep === 4 && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-6 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Enter Amount</h3>
                  <p className="text-sm text-gray-600">How much electricity do you want to purchase?</p>
                </div>

                <div className="max-w-sm mx-auto">
                  <label className="block text-sm md:text-base font-semibold text-gray-900 mb-2">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={selectedAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedAmount(value);
                      // Calculate savings when amount changes
                      const calculatedSavings = calculateSavings(value, commissionRate);
                      setSavings(calculatedSavings);
                    }}
                    className="w-full px-3 py-2 md:py-3 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium bg-white focus:border-yellow-500 focus:outline-none transition-colors"
                    placeholder={`Min: ₦${minAmount.toLocaleString()} - Max: ₦${maxAmount.toLocaleString()}`}
                    min={minAmount}
                    max={maxAmount}
                  />

                  {/* Selected Amount Display */}
                  {selectedAmount && (
                    <div className="mt-3 space-y-3">
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <FaCreditCard className="text-yellow-600 text-sm" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">₦{parseFloat(selectedAmount).toLocaleString()}</h4>
                            <p className="text-xs text-gray-600">Electricity purchase amount</p>
                          </div>
                        </div>
                      </div>

                      {/* Commission Savings Display */}
                      {commissionRate > 0 && savings > 0 && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <FaBolt className="text-green-600 text-sm" />
                            </div>
                            <div>
                              <h4 className="font-bold text-green-900 text-sm">You Save: ₦{savings.toLocaleString()}</h4>
                              <p className="text-xs text-green-700">
                                {commissionRate}% commission discount applied
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                You pay: ₦{(parseFloat(selectedAmount) - savings).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Amount Limits Info */}
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <FaBolt className="text-blue-600 text-sm" />
                          <span className="text-sm font-medium text-blue-800">Amount Limits</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Minimum: ₦{minAmount.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-700">
                          Maximum: ₦{maxAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          These limits are set by your service provider for security and compliance.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-3 md:mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (selectedAmount) {
                        setCurrentStep(5);
                      }
                    }}
                    disabled={!selectedAmount}
                    className="px-3 md:px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Phone Number */}
            {currentStep === 5 && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-6 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Confirm Phone Number</h3>
                  <p className="text-sm text-gray-600">We'll send your receipt to this number</p>
                </div>

                <div className="max-w-sm mx-auto">
                  <label className="block text-sm md:text-base font-semibold text-gray-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 md:py-3 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium bg-white focus:border-yellow-500 focus:outline-none transition-colors"
                    placeholder="+2348012345678"
                  />
                </div>

                {/* Navigation Buttons */}
                <div className="mt-3 md:mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (phoneNumber) {
                        setCurrentStep(6);
                      }
                    }}
                    disabled={!phoneNumber}
                    className="px-3 md:px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Confirmation & Purchase */}
            {currentStep === 6 && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-6 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Confirm Your Purchase</h3>
                  <p className="text-sm text-gray-600">Review your electricity purchase details</p>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-3 md:p-4 mb-3 md:mb-4">
                  <h4 className="text-sm md:text-base font-bold text-gray-900 mb-2 md:mb-3">Purchase Summary</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <FaBolt className="text-yellow-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Electricity Provider</div>
                          <div className="text-xs text-gray-600">
                            {providers?.discos?.find(d => d.serviceID === selectedDisco)?.displayName || selectedDisco?.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FaBolt className="text-blue-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Meter Type</div>
                          <div className="text-xs text-gray-600">{selectedMeterType?.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaUser className="text-green-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Customer Name</div>
                          <div className="text-xs text-gray-600">{customerName}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FaCreditCard className="text-purple-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Amount</div>
                          <div className="text-xs text-gray-600">₦{selectedAmount}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div className="font-medium text-gray-900 text-sm">Purchase Amount</div>
                        <div className="text-sm text-gray-900">
                          ₦{parseFloat(selectedAmount).toLocaleString()}
                        </div>
                      </div>

                      {commissionRate > 0 && savings > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="font-medium text-green-700 text-sm">Commission Discount ({commissionRate}%)</div>
                          <div className="text-sm text-green-700">
                            -₦{savings.toLocaleString()}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
                        <div className="font-bold text-gray-900 text-base">You Pay</div>
                        <div className="text-xl font-bold text-yellow-600">
                          ₦{(parseFloat(selectedAmount) - savings).toLocaleString()}
                        </div>
                      </div>

                      {commissionRate > 0 && savings > 0 && (
                        <div className="text-xs text-green-600 text-center mt-2">
                          🎉 You save ₦{savings.toLocaleString()} with our commission discount!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={confirmPurchase}
                    disabled={isConfirming}
                    className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-sm"
                  >
                    {isConfirming ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <FaCreditCard className="text-xs md:text-sm" />
                        <span>Pay ₦{selectedAmount}</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Navigation for other steps */}
            {currentStep < 6 && (
              <div className="bg-white border-t border-gray-200 px-4 py-3 mt-4 pb-8">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <div className="text-xs text-gray-500 flex items-center">
                    Step {currentStep} of 6
                  </div>
                </div>
              </div>
            )}

            {/* Final step navigation */}
            {currentStep === 6 && (
              <div className="bg-white border-t border-gray-200 px-4 py-3 mt-4 pb-8">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <div className="text-xs text-gray-500 flex items-center">
                    Step 6 of 6 - Ready to Purchase
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      {showSuccessModal && purchaseResult && (
        <Modal
          isDarkMode={isDarkMode}
          isOpen={showSuccessModal}
          closeModal={() => setShowSuccessModal(false)}
          size="md"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Purchase Successful!</h3>
            <p className="text-gray-600 mb-4">Your electricity purchase has been completed successfully.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="font-medium">Transaction ID:</span>
                  <span className="text-sm">{purchaseResult.transaction?.requestId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Amount:</span>
                  <span>₦{purchaseResult.transaction?.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="text-green-600 font-medium">{purchaseResult.transaction?.status}</span>
                </div>
                {purchaseResult.transaction?.token && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="font-medium text-yellow-800 mb-1">Electricity Token:</div>
                    <div className="text-lg font-mono text-yellow-900 break-all">
                      {purchaseResult.transaction.token}
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      Please save this token. It will also be sent to your email and phone.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRequeryTransaction}
                disabled={isRequerying}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {isRequerying ? (
                  <div className="flex items-center justify-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Checking...
                  </div>
                ) : (
                  'Check Status'
                )}
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

ElectricityPurchase.propTypes = {
  isDarkMode: PropTypes.bool
};

export default ElectricityPurchase;