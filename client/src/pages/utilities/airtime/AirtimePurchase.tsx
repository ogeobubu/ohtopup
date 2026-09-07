import PurchaseHeader from "../components/PurchaseHeader";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { getWallet, getUser, getAirtimeProviders, getAirtimeSettings } from "../../../api";
import Modal from "../../../admin/components/modal";
import useAirtimePurchase from "./hooks/useAirtimePurchase";
import { formatPhoneNumber, formatNairaAmount, extractNetworkFromPhoneNumber } from "../../../utils";
import { FaMobileAlt, FaCheck, FaUser, FaCreditCard, FaChevronRight } from "react-icons/fa";
import { useOfflineQueue } from "../../../hooks/useOfflineQueue";

const Loader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    <p className="mt-3 text-[var(--ot-muted)] ">Loading airtime services...</p>
  </div>
);

const AirtimePurchase = ({ isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [useCustomPhone, setUseCustomPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Network, 2: Amount, 3: Phone, 4: PIN, 5: Confirm
  const [networkReset, setNetworkReset] = useState(false); // Track if network was reset
  const [detectedNetwork, setDetectedNetwork] = useState(''); // Auto-detected network from phone number
  const [networkConflict, setNetworkConflict] = useState(false); // Track if there's a conflict between selected and detected network

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

  const { data: airtimeSettings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['airtime', 'settings'],
    queryFn: () => getAirtimeSettings(),
  });

  const { mutateAsync } = useAirtimePurchase(() => {
    setIsModalOpen(false);
  });

  const [isConfirming, setIsConfirming] = useState(false);
  const { isOnline, addToQueue } = useOfflineQueue();

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

    // Auto-detect network from phone number
    const detected = extractNetworkFromPhoneNumber(cleanValue);
    setDetectedNetwork(detected || '');

    // Check for network conflict
    if (detected && selectedNetwork && detected !== selectedNetwork) {
      setNetworkConflict(true);
    } else {
      setNetworkConflict(false);
    }
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
    // Reset network conflict and detected network when manually changing network
    setNetworkConflict(false);
    setDetectedNetwork('');
  };

  // Handle network conflict resolution
  const resolveNetworkConflict = (useDetected) => {
    if (useDetected) {
      // Switch to detected network
      handleNetworkChange(detectedNetwork);
    } else {
      // Keep current network, reset phone number to clear conflict
      setPhoneNumber('');
      setDetectedNetwork('');
      setNetworkConflict(false);
    }
  };

  const confirmPurchase = async () => {
    try {
      setIsConfirming(true);
      const formattedPhone = formatPhoneNumber(phoneNumber);

      if (!isOnline) {
        // Queue transaction for offline processing
        const queuedTransaction = {
          type: 'airtime',
          amount: parseFloat(selectedAmount),
          phoneNumber: formattedPhone,
          provider: selectedNetwork,
          transactionPin: transactionPin
        };

        addToQueue(queuedTransaction);
        alert('Transaction queued! It will be processed when you\'re back online.');
        setIsModalOpen(false);
        return;
      }

      // Online purchase
      await mutateAsync({
        serviceID: selectedNetwork, // This is the network code (e.g., "mtn", "glo")
        amount: selectedAmount,
        phone: formattedPhone,
        transactionPin: transactionPin,
      });
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Commission calculation
  const calculateCommission = (amount, network) => {
    if (!airtimeSettings?.settings || !amount) {
      return { commissionAmount: 0, adjustedAmount: amount };
    }

    // Check for network-specific commission rate first, then fall back to global
    const networkSettings = airtimeSettings.settings.networks?.[network];
    const globalSettings = airtimeSettings.settings.global;

    const commissionRate = networkSettings?.airtimeCommissionRate ||
                          globalSettings?.airtimeCommissionRate || 0;

    const commissionAmount = (amount * commissionRate) / 100;
    const adjustedAmount = amount - commissionAmount;

    return { commissionAmount, adjustedAmount, commissionRate };
  };

  const { commissionAmount, adjustedAmount, commissionRate } = calculateCommission(
    parseFloat(selectedAmount) || 0,
    selectedNetwork
  );

  const isLoading = isWalletLoading || isProvidersLoading || isUserLoading || isSettingsLoading;



  return (
    <div className="ot-utility-intro">
      <div><h3>Buy airtime</h3><p>Choose your network and the amount you want to top up.</p><button className="ot-button ot-button-primary" onClick={() => setIsModalOpen(true)}>Choose airtime</button></div>

      <Modal
        isDarkMode={isDarkMode}
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        size="lg"
        showCloseButton={false}
        stickyHeader={<PurchaseHeader title="Buy airtime" step={currentStep} total={5} onClose={() => setIsModalOpen(false)} />}
      >
        {isLoading ? (
          <Loader />
        ) : (
          <div className="ot-purchase-content flex flex-col">

            {/* Offline Status Banner */}
            {!isOnline && (
              <div className="mx-3 md:mx-4 mb-2 md:mb-3">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 md:p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm md:text-base">⚠️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-semibold text-yellow-900 dark:text-yellow-100">
                        You're Offline
                      </h3>
                      <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300">
                        Your transaction will be queued and processed when you're back online
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Network Selection */}
            {currentStep === 1 && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-16 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-[var(--ot-ink)] mb-1">Choose Your Network</h3>
                  <p className="text-sm text-[var(--ot-muted)]">Select your mobile network provider</p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3 max-w-sm mx-auto">
                  {providers?.map(provider => (
                    <button
                      key={provider.serviceID}
                      onClick={() => {
                        handleNetworkChange(provider.serviceID);
                      }}
                      className={`p-3 md:p-4 bg-[var(--ot-paper)] border-2 rounded-xl transition-all duration-200 hover:shadow-md active:scale-95 ${
                        selectedNetwork === provider.serviceID
                          ? 'border-blue-500 bg-[var(--ot-tint)] shadow-md'
                          : 'border-[var(--ot-line)] hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--ot-tint)] rounded-full flex items-center justify-center mx-auto mb-1 md:mb-2">
                          <FaMobileAlt className="text-[var(--ot-accent)] text-base md:text-lg" />
                        </div>
                        <div className="text-base md:text-lg font-bold text-[var(--ot-ink)] mb-1">
                          {provider.name?.toUpperCase() || provider.serviceID?.toUpperCase() || 'UNKNOWN'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

            {/* Navigation Buttons */}
                <div className="mt-4 md:mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      if (selectedNetwork) {
                        setCurrentStep(2);
                        setNetworkReset(false);
                      }
                    }}
                    disabled={!selectedNetwork}
                    className="px-4 md:px-6 py-2 md:py-3 bg-[#3057c5] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>

                {/* Network Change Notification */}
                {selectedNetwork && (
                  <div className="mt-3 p-3 bg-[var(--ot-tint)] border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[var(--ot-tint)] rounded-full flex items-center justify-center">
                        <FaCheck className="text-[var(--ot-accent)] text-xs" />
                      </div>
                      <div className="text-sm text-[var(--ot-accent)]">
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
              <div className="px-3 md:px-4 py-3 md:py-4 pb-16 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-[var(--ot-ink)] mb-1">Choose Amount</h3>
                  <p className="text-sm text-[var(--ot-muted)]">Select airtime amount for {selectedNetwork?.toUpperCase()}</p>
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
                  <label className="block text-sm md:text-base font-semibold text-[var(--ot-ink)] mb-2">
                    Enter Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    className="w-full px-3 py-2 md:py-3 border-2 border-[var(--ot-line)] rounded-lg text-sm md:text-base font-medium bg-[var(--ot-paper)] focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter amount"
                    min="50"
                  />


                  {/* Selected Amount Display */}
                  {selectedAmount && (
                    <div className="mt-3 p-3 bg-[var(--ot-tint)] rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--ot-tint)] rounded-lg flex items-center justify-center">
                          <FaCreditCard className="text-[var(--ot-accent)] text-sm" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-[var(--ot-ink)] text-sm">₦{selectedAmount}</h4>
                            <span className="text-xs text-[var(--ot-muted)]">Airtime amount</span>
                          </div>
                          {commissionAmount > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              💰 Save ₦{commissionAmount.toFixed(2)} ({commissionRate}%)
                            </div>
                          )}
                          {commissionAmount > 0 && (
                            <div className="text-xs text-[var(--ot-accent)] font-medium mt-1">
                              You pay: ₦{adjustedAmount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-3 md:mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-3 md:px-4 py-2 bg-[var(--ot-bg)] text-[var(--ot-ink)] rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors text-sm"
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
                    className="px-3 md:px-4 py-2 bg-[#3057c5] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Phone Number Selection */}
            {currentStep === 3 && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-16 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-[var(--ot-ink)] mb-1">Confirm Phone Number</h3>
                  <p className="text-sm text-[var(--ot-muted)]">Airtime will be sent to this number</p>
                </div>

                <div className="max-w-sm mx-auto space-y-2 md:space-y-3">
                  {/* Registered Number Option */}
                  <button
                    onClick={() => {
                      setUseCustomPhone(false);
                      if (user?.phoneNumber) {
                        const formattedNumber = formatPhoneNumberForDisplay(user.phoneNumber);
                        setPhoneNumber(formattedNumber);
                        setPhoneError('');

                        // Auto-detect network from registered number
                        const detected = extractNetworkFromPhoneNumber(user.phoneNumber);
                        setDetectedNetwork(detected || '');

                        // Check for network conflict
                        if (detected && selectedNetwork && detected !== selectedNetwork) {
                          setNetworkConflict(true);
                        } else {
                          setNetworkConflict(false);
                        }

                        setCurrentStep(4);
                      }
                    }}
                    className="w-full p-3 md:p-4 bg-[var(--ot-paper)] border-2 border-[var(--ot-line)] rounded-xl transition-all duration-200 hover:shadow-md hover:border-blue-300"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-[var(--ot-tint)] rounded-lg flex items-center justify-center">
                        <FaUser className="text-[var(--ot-accent)] text-base md:text-lg" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-[var(--ot-ink)] text-sm md:text-base">My registered number</div>
                        <div className="text-[var(--ot-muted)] text-xs md:text-sm truncate">
                          {user?.phoneNumber ? formatPhoneNumberForDisplay(user.phoneNumber) : 'No registered number'}
                        </div>
                      </div>
                      <div className="text-[var(--ot-accent)]">
                        <FaChevronRight className="text-base md:text-lg" />
                      </div>
                    </div>
                  </button>

                  {/* Custom Number Option */}
                  <button
                    onClick={() => setUseCustomPhone(true)}
                    className="w-full p-3 md:p-4 bg-[var(--ot-paper)] border-2 border-[var(--ot-line)] rounded-xl transition-all duration-200 hover:shadow-md hover:border-green-300"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaCheck className="text-green-600 text-base md:text-lg" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-[var(--ot-ink)] text-sm md:text-base">Enter different number</div>
                        <div className="text-[var(--ot-muted)] text-xs md:text-sm">Use another phone number</div>
                      </div>
                      <div className="text-green-600">
                        <FaChevronRight className="text-base md:text-lg" />
                      </div>
                    </div>
                  </button>

                  {/* Custom Phone Input */}
                  {useCustomPhone && (
                    <div className="bg-[var(--ot-paper)] p-3 md:p-4 rounded-xl border-2 border-[var(--ot-line)]">
                      <label className="block text-sm md:text-base font-semibold text-[var(--ot-ink)] mb-2">
                        Enter Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        className={`w-full px-3 py-2 md:py-3 border-2 rounded-lg text-sm md:text-base font-medium ${
                          phoneError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[var(--ot-line)] focus:border-blue-500'
                        }`}
                        placeholder="+2348012345678"
                        autoFocus
                      />


                      {phoneError && (
                        <p className="text-xs text-red-600 mt-2 font-medium">{phoneError}</p>
                      )}

                      {/* Network Detection Display */}
                      {detectedNetwork && !phoneError && (
                        <div className="mt-3 p-3 bg-[var(--ot-tint)] border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-[var(--ot-tint)] rounded-full flex items-center justify-center">
                              <FaMobileAlt className="text-[var(--ot-accent)] text-xs" />
                            </div>
                            <div className="text-sm text-[var(--ot-accent)]">
                              <span className="font-medium">Detected Network: {detectedNetwork?.toUpperCase()}</span>
                              {selectedNetwork === detectedNetwork && (
                                <span className="text-green-600 ml-1">✓ Matches selected network</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Network Conflict Warning */}
                      {networkConflict && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                              <span className="text-orange-600 text-xs">⚠️</span>
                            </div>
                            <div className="text-sm text-orange-800">
                              <span className="font-medium">Network Mismatch Detected</span>
                            </div>
                          </div>
                          <p className="text-xs text-orange-700 mb-3">
                            The phone number you entered belongs to <strong>{detectedNetwork?.toUpperCase()}</strong>,
                            but you selected <strong>{selectedNetwork?.toUpperCase()}</strong>.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => resolveNetworkConflict(true)}
                              className="flex-1 px-3 py-2 bg-[#3057c5] text-white text-xs rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                              Switch to {detectedNetwork?.toUpperCase()}
                            </button>
                            <button
                              onClick={() => resolveNetworkConflict(false)}
                              className="flex-1 px-3 py-2 bg-[var(--ot-bg)] text-[var(--ot-ink)] text-xs rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors"
                            >
                              Keep {selectedNetwork?.toUpperCase()}
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-[var(--ot-muted)] mt-2">
                        Enter a valid Nigerian phone number (e.g., +2348012345678, 08012345678, or 8012345678)
                      </p>
                      <div className="flex gap-2 mt-3 md:mt-4">
                        <button
                          onClick={() => setUseCustomPhone(false)}
                          className="flex-1 px-3 md:px-4 py-2 bg-[var(--ot-bg)] text-[var(--ot-ink)] rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors text-sm"
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
                          className="flex-1 px-3 md:px-4 py-2 bg-[#3057c5] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          Continue to PIN
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-3 md:mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-3 md:px-4 py-2 bg-[var(--ot-bg)] text-[var(--ot-ink)] rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors text-sm"
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
                    className="px-3 md:px-4 py-2 bg-[#3057c5] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Continue to PIN
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Transaction PIN */}
            {currentStep === 4 && selectedNetwork && selectedAmount && phoneNumber && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-16 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-[var(--ot-ink)] mb-1">Enter Transaction PIN</h3>
                  <p className="text-sm text-[var(--ot-muted)]">Enter your 4-6 digit transaction PIN to proceed</p>
                </div>

                <div className="max-w-sm mx-auto space-y-3">
                  <div className="bg-[var(--ot-paper)] p-4 rounded-xl border-2 border-[var(--ot-line)]">
                    <label className="block text-base font-semibold text-[var(--ot-ink)] mb-2">
                      Transaction PIN
                    </label>
                    <input
                      type="password"
                      value={transactionPin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                        setTransactionPin(value);
                        setPinError(value.length < 4 || value.length > 6 ? 'PIN must be 4-6 digits' : '');
                      }}
                      className={`w-full px-3 py-3 border-2 rounded-lg text-base font-medium ${
                        pinError
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[var(--ot-line)] focus:border-blue-500'
                      }`}
                      placeholder="Enter your PIN"
                      maxLength={6}
                      autoFocus
                    />
                    {pinError && (
                      <p className="text-xs text-red-600 mt-2 font-medium">{pinError}</p>
                    )}
                    <p className="text-xs text-[var(--ot-muted)] mt-2">
                      Enter your 4-6 digit transaction PIN to secure this transaction
                    </p>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="flex-1 px-4 py-3 bg-[var(--ot-bg)] text-[var(--ot-ink)] rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors text-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        if (transactionPin && !pinError) {
                          setCurrentStep(5);
                        }
                      }}
                      disabled={!transactionPin || !!pinError}
                      className="flex-1 px-4 py-3 bg-[#3057c5] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation & Purchase */}
            {currentStep === 5 && selectedNetwork && selectedAmount && phoneNumber && transactionPin && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-16 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-[var(--ot-ink)] mb-1">Confirm Your Purchase</h3>
                  <p className="text-sm text-[var(--ot-muted)]">Review your selection and complete the purchase</p>
                </div>

                {/* Order Summary */}
                <div className="bg-[var(--ot-paper)] rounded-xl border-2 border-[var(--ot-line)] p-3 md:p-4 mb-3 md:mb-4">
                  <h4 className="text-sm md:text-base font-bold text-[var(--ot-ink)] mb-2 md:mb-3">Order Summary</h4>

                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--ot-tint)] rounded-lg flex items-center justify-center">
                          <FaMobileAlt className="text-[var(--ot-accent)] text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-[var(--ot-ink)] text-sm">Network Provider</div>
                          <div className="text-xs text-[var(--ot-muted)]">{selectedNetwork?.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaCreditCard className="text-green-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-[var(--ot-ink)] text-sm">Airtime Amount</div>
                          <div className="text-xs text-[var(--ot-muted)]">₦{selectedAmount}</div>
                          {commissionAmount > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              Commission: -₦{commissionAmount.toFixed(2)} ({commissionRate}%)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FaUser className="text-purple-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-[var(--ot-ink)] text-sm">Phone Number</div>
                          <div className="text-xs text-[var(--ot-muted)]">{phoneNumber}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 bg-[var(--ot-bg)] rounded-lg px-3">
                      <div className="font-bold text-[var(--ot-ink)] text-base">
                        {commissionAmount > 0 ? 'Amount to Pay' : 'Total Amount'}
                      </div>
                      <div className="text-xl font-bold text-[var(--ot-accent)]">
                        ₦{commissionAmount > 0 ? adjustedAmount.toFixed(2) : selectedAmount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-[var(--ot-bg)] text-[var(--ot-ink)] rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={confirmPurchase}
                    disabled={isConfirming}
                    className={`flex-1 px-3 md:px-4 py-2 md:py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-sm ${
                      isOnline
                        ? 'bg-[#3057c5] hover:bg-blue-700'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {isConfirming ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <FaCreditCard className="text-xs md:text-sm" />
                        <span>
                          {isOnline ? 'Pay' : 'Queue'} ₦{commissionAmount > 0 ? adjustedAmount.toFixed(2) : selectedAmount}
                          {commissionAmount > 0 && isOnline && (
                            <span className="text-xs block text-green-600">
                              (Save ₦{commissionAmount.toFixed(2)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </button>
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
