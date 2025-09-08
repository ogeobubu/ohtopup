import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { getWallet, getUser, getAirtimeProviders } from "../../../api";
import Modal from "../../../admin/components/modal";
import useAirtimePurchase from "./hooks/useAirtimePurchase";
import { formatPhoneNumber, formatNairaAmount } from "../../../utils";
import { FaMobileAlt, FaCheck, FaUser, FaCreditCard, FaChevronRight } from "react-icons/fa";

const Loader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    <p className="mt-3 text-gray-600 dark:text-gray-400">Loading airtime services...</p>
  </div>
);

const AirtimePurchase = ({ isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [useCustomPhone, setUseCustomPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Network, 2: Amount, 3: Phone, 4: Confirm
  const [networkReset, setNetworkReset] = useState(false); // Track if network was reset

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
    queryKey: ['providers', 'airtime'],
    queryFn: () => getAirtimeProviders(),
  });

  const { mutateAsync } = useAirtimePurchase(() => {
    setIsModalOpen(false);
  });

  const [isConfirming, setIsConfirming] = useState(false);

  // Initialize phone number
  useEffect(() => {
    if (user?.phoneNumber && !useCustomPhone) {
      const formattedNumber = formatPhoneNumberForDisplay(user.phoneNumber);
      setPhoneNumber(formattedNumber);
    }
  }, [user, useCustomPhone]);

  // Helper function to format phone number for display
  const formatPhoneNumberForDisplay = (phone) => {
    if (!phone) return '';

    // Remove any non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // If already starts with +234, return as is
    if (cleanPhone.startsWith('+234')) {
      return cleanPhone;
    }

    // If starts with 234, add +
    if (cleanPhone.startsWith('234')) {
      return '+' + cleanPhone;
    }

    // If starts with 0, replace with +234
    if (cleanPhone.startsWith('0')) {
      return '+234' + cleanPhone.substring(1);
    }

    // If it's just the 10-digit number, add +234
    if (cleanPhone.length === 10) {
      return '+234' + cleanPhone;
    }

    // Return as is if none of the above
    return cleanPhone;
  };

  // Phone number validation
  const validatePhoneNumber = (phone) => {
    if (!phone) return 'Phone number is required';

    // Remove any spaces, hyphens, or other non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Check if it's a valid Nigerian phone number
    // Nigerian numbers: +234 + 10 digits, 234 + 10 digits, 0 + 10 digits, or 10 digits
    // Allow all digits 0-9 for the first digit after country code/prefix
    const nigerianPhoneRegex = /^(\+234|234|0)?([0-9]\d{9})$/;

    if (!nigerianPhoneRegex.test(cleanPhone)) {
      return 'Please enter a valid Nigerian phone number (e.g., +2348012345678, 08012345678, or 8012345678)';
    }

    return '';
  };

  // Handle phone number change
  const handlePhoneNumberChange = (value) => {
    // Clean the input value
    const cleanValue = value.replace(/[^\d+\s-()]/g, '');
    setPhoneNumber(cleanValue);
    setPhoneError(validatePhoneNumber(cleanValue));
  };

  // Handle network change - reset dependent data
  const handleNetworkChange = (network) => {
    // If changing to a different network, reset dependent selections
    if (selectedNetwork && selectedNetwork !== network) {
      setSelectedAmount('');
      setPhoneNumber('');
      setPhoneError('');
      setUseCustomPhone(false);
      setCurrentStep(2); // Reset to amount selection step
      setNetworkReset(true); // Mark that network was reset
    } else {
      setNetworkReset(false); // Clear reset flag if same network
    }

    setSelectedNetwork(network);
  };

  const confirmPurchase = async () => {
    try {
      setIsConfirming(true);
      const formattedPhone = formatPhoneNumber(phoneNumber);

      await mutateAsync({
        serviceID: selectedNetwork, // This is the network code (e.g., "mtn", "glo")
        amount: selectedAmount,
        phone: formattedPhone,
      });
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const isLoading = isWalletLoading || isProvidersLoading || isUserLoading;

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  return (
    <div className="border border-solid border-gray-200 rounded-xl p-8 h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <FaMobileAlt className="text-white text-3xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Buy Airtime</h3>
        <p className="text-gray-600 mb-6">Top up your mobile phone instantly</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          Start Purchasing
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
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <FaMobileAlt className="text-white text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Buy Airtime</h2>
                    <p className="text-xs text-gray-500">Quick and easy airtime purchase</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-gray-500 text-sm">×</span>
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-1">
                {[
                  { step: 1, label: 'Network' },
                  { step: 2, label: 'Amount' },
                  { step: 3, label: 'Phone' },
                  { step: 4, label: 'Confirm' }
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step ? <FaCheck className="text-xs" /> : step}
                    </div>
                    <span className={`ml-1 text-xs font-medium ${
                      currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {label}
                    </span>
                    {step < 4 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Balance Card */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <FaCreditCard className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Available Balance</p>
                      <p className="text-xl font-bold text-gray-900">
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
            {/* Step 1: Network Selection */}
            {currentStep === 1 && (
              <div className="px-4 py-4 pb-8">
                <div className="mb-4 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Choose Your Network</h3>
                  <p className="text-sm text-gray-600">Select your mobile network provider</p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  {providers?.map(provider => (
                    <button
                      key={provider.serviceID}
                      onClick={() => {
                        handleNetworkChange(provider.serviceID);
                      }}
                      className={`p-4 bg-white border-2 rounded-xl transition-all duration-200 hover:shadow-md active:scale-95 ${
                        selectedNetwork === provider.serviceID
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <FaMobileAlt className="text-blue-600 text-lg" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 mb-1">
                          {provider.name?.toUpperCase() || provider.serviceID?.toUpperCase() || 'UNKNOWN'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      if (selectedNetwork) {
                        setCurrentStep(2);
                        setNetworkReset(false);
                      }
                    }}
                    disabled={!selectedNetwork}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>

                {/* Network Change Notification */}
                {selectedNetwork && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaCheck className="text-blue-600 text-xs" />
                      </div>
                      <div className="text-sm text-blue-800">
                        <span className="font-medium">{selectedNetwork?.toUpperCase()}</span> selected.
                        {networkReset && (
                          <span className="text-orange-600 ml-1 block mt-1">
                            ⚠️ Previous selections have been reset.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Amount Selection */}
            {currentStep === 2 && selectedNetwork && (
              <div className="px-4 py-4 pb-8">
                <div className="mb-4 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Choose Amount</h3>
                  <p className="text-sm text-gray-600">Select airtime amount for {selectedNetwork?.toUpperCase()}</p>
                </div>

                {/* Network Reset Notification */}
                {networkReset && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-xs">⚠️</span>
                      </div>
                      <div className="text-sm text-orange-800">
                        <span className="font-medium">Network changed</span> - Please select a new amount for {selectedNetwork?.toUpperCase()}.
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div className="max-w-sm mx-auto">
                  <label className="block text-base font-semibold text-gray-900 mb-2">
                    Enter Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base font-medium bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter amount"
                    min="50"
                  />

                  {/* Selected Amount Display */}
                  {selectedAmount && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FaCreditCard className="text-blue-600 text-sm" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">₦{selectedAmount}</h4>
                          <p className="text-xs text-gray-600">Airtime amount</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (selectedAmount) {
                        setCurrentStep(3);
                      }
                    }}
                    disabled={!selectedAmount}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Phone Number Selection */}
            {currentStep === 3 && (
              <div className="px-4 py-4 pb-8">
                <div className="mb-4 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Confirm Phone Number</h3>
                  <p className="text-sm text-gray-600">Airtime will be sent to this number</p>
                </div>

                <div className="max-w-sm mx-auto space-y-3">
                  {/* Registered Number Option */}
                  <button
                    onClick={() => {
                      setUseCustomPhone(false);
                      if (user?.phoneNumber) {
                        const formattedNumber = formatPhoneNumberForDisplay(user.phoneNumber);
                        setPhoneNumber(formattedNumber);
                        setPhoneError('');
                        setCurrentStep(4);
                      }
                    }}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 hover:shadow-md hover:border-blue-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaUser className="text-blue-600 text-lg" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-gray-900 text-base">My registered number</div>
                        <div className="text-gray-600 text-sm">
                          {user?.phoneNumber ? formatPhoneNumberForDisplay(user.phoneNumber) : 'No registered number'}
                        </div>
                      </div>
                      <div className="text-blue-600">
                        <FaChevronRight className="text-lg" />
                      </div>
                    </div>
                  </button>

                  {/* Custom Number Option */}
                  <button
                    onClick={() => setUseCustomPhone(true)}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 hover:shadow-md hover:border-green-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaCheck className="text-green-600 text-lg" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-gray-900 text-base">Enter different number</div>
                        <div className="text-gray-600 text-sm">Use another phone number</div>
                      </div>
                      <div className="text-green-600">
                        <FaChevronRight className="text-lg" />
                      </div>
                    </div>
                  </button>

                  {/* Custom Phone Input */}
                  {useCustomPhone && (
                    <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                      <label className="block text-base font-semibold text-gray-900 mb-2">
                        Enter Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        className={`w-full px-3 py-3 border-2 rounded-lg text-base font-medium ${
                          phoneError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="+2348012345678"
                        autoFocus
                      />
                      {phoneError && (
                        <p className="text-xs text-red-600 mt-2 font-medium">{phoneError}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Enter a valid Nigerian phone number (e.g., +2348012345678, 08012345678, or 8012345678)
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setUseCustomPhone(false)}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => {
                            if (!phoneError && phoneNumber) {
                              setCurrentStep(4);
                            }
                          }}
                          disabled={!!phoneError || !phoneNumber}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (phoneNumber && !phoneError) {
                        setCurrentStep(4);
                      }
                    }}
                    disabled={!phoneNumber || !!phoneError}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation & Purchase */}
            {currentStep === 4 && selectedNetwork && selectedAmount && phoneNumber && (
              <div className="px-4 py-4 pb-8">
                <div className="mb-4 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Confirm Your Purchase</h3>
                  <p className="text-sm text-gray-600">Review your selection and complete the purchase</p>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4">
                  <h4 className="text-base font-bold text-gray-900 mb-3">Order Summary</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FaMobileAlt className="text-blue-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Network Provider</div>
                          <div className="text-xs text-gray-600">{selectedNetwork?.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaCreditCard className="text-green-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Airtime Amount</div>
                          <div className="text-xs text-gray-600">₦{selectedAmount}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FaUser className="text-purple-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Phone Number</div>
                          <div className="text-xs text-gray-600">{phoneNumber}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
                      <div className="font-bold text-gray-900 text-base">Total Amount</div>
                      <div className="text-xl font-bold text-blue-600">
                        ₦{selectedAmount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={confirmPurchase}
                    disabled={isConfirming}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-sm"
                  >
                    {isConfirming ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <FaCreditCard className="text-sm" />
                        <span>Pay ₦{selectedAmount}</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons for other steps */}
            {currentStep < 4 && (
              <div className="bg-white border-t border-gray-200 px-4 py-3 mt-4 pb-8">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <div className="text-xs text-gray-500 flex items-center">
                    Step {currentStep} of 4
                  </div>
                </div>
              </div>
            )}

            {/* Final step navigation */}
            {currentStep === 4 && (
              <div className="bg-white border-t border-gray-200 px-4 py-3 mt-4 pb-8">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <div className="text-xs text-gray-500 flex items-center">
                    Step 4 of 4 - Ready to Purchase
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

AirtimePurchase.propTypes = {
  isDarkMode: PropTypes.bool
};

export default AirtimePurchase;
