import PurchaseHeader from "../components/PurchaseHeader";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWallet, getSelectedPlansForUsers, getUser, getAirtimeSettings } from '../../../api';
import Modal from '../../../admin/components/modal';
import useDataPurchase from './hooks/useDataPurchase';
import { formatNairaAmount, formatPhoneNumber } from '../../../utils';
import { FaWifi, FaCheck, FaEdit, FaUser, FaSignal, FaCreditCard, FaChevronRight } from 'react-icons/fa';

const Loader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    <p className="mt-3 text-[var(--ot-muted)] ">Loading data plans...</p>
  </div>
);

const DataPurchase = ({ isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [useCustomPhone, setUseCustomPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Network, 2: Plan, 3: Phone, 4: PIN, 5: Confirm
  const [dataReset, setDataReset] = useState(false); // Track if data was reset due to network change

  // Fetch selected data plans from admin
  const { data: selectedPlansData, isLoading: isSelectedPlansLoading } = useQuery({
    queryKey: ['selected-data-plans'],
    queryFn: getSelectedPlansForUsers,
  });

  const { data: walletData, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
  });

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  const { data: airtimeSettings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['airtime', 'settings'],
    queryFn: () => getAirtimeSettings(),
  });

  // Get available networks from selected plans
  const availableNetworks = selectedPlansData?.plans ? Object.keys(selectedPlansData.plans) : [];

  // Auto-select first network when data is loaded
  useEffect(() => {
    if (availableNetworks.length > 0 && !selectedNetwork && !isSelectedPlansLoading) {
      setSelectedNetwork(availableNetworks[0]);
    }
  }, [availableNetworks, selectedNetwork, isSelectedPlansLoading]);

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

  // Get plans for selected network
  const networkPlans = selectedNetwork && selectedPlansData?.plans ? selectedPlansData.plans[selectedNetwork] || [] : [];



  // Phone number validation
  const validatePhoneNumber = (phone) => {
    if (!phone) return 'Phone number is required';

    // Remove any spaces, hyphens, or other non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Check if it's a valid Nigerian phone number
    // Nigerian numbers: +234 + 10 digits, 234 + 10 digits, 0 + 10 digits, or 10 digits
    const nigerianPhoneRegex = /^(\+234|234|0)?([56789]\d{9})$/;

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
      setSelectedPlan(null);
      setPhoneNumber('');
      setPhoneError('');
      setUseCustomPhone(false);
      setCurrentStep(2); // Reset to plan selection step
      setDataReset(true); // Mark that data was reset
    } else {
      setDataReset(false); // Clear reset flag if same network
    }

    setSelectedNetwork(network);
  };


  const { mutateAsync } = useDataPurchase(() => {
    setIsModalOpen(false);
  });

  const [isConfirming, setIsConfirming] = useState(false);

  const confirmPurchase = async () => {
    try {
      setIsConfirming(true);
      await mutateAsync({
        serviceID: selectedPlan.providerName,
        billersCode: formatPhoneNumber(phoneNumber),
        variation_code: selectedPlan.planId,
        amount: selectedPlan.finalPrice || selectedPlan.amount,
        phone: formatPhoneNumber(phoneNumber),
        provider: selectedPlan.providerName,
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

    const commissionRate = networkSettings?.dataCommissionRate ||
                          globalSettings?.dataCommissionRate || 0;

    const commissionAmount = (amount * commissionRate) / 100;
    const adjustedAmount = amount - commissionAmount;

    return { commissionAmount, adjustedAmount, commissionRate };
  };

  const { commissionAmount, adjustedAmount, commissionRate } = selectedPlan && selectedNetwork ?
    calculateCommission(selectedPlan.finalPrice || selectedPlan.amount, selectedNetwork) :
    { commissionAmount: 0, adjustedAmount: 0, commissionRate: 0 };

  const isLoading = isSelectedPlansLoading || isWalletLoading || isUserLoading || isSettingsLoading;

  return (
    <div className="ot-utility-intro">
      <div><h3>Buy data</h3><p>Find a data plan for your network and your everyday needs.</p><button className="ot-button ot-button-primary" onClick={() => setIsModalOpen(true)}>Choose data</button></div>

      <Modal
        isDarkMode={isDarkMode}
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        size="lg"
        showCloseButton={false}
        stickyHeader={<PurchaseHeader title="Buy data" step={currentStep} total={5} onClose={() => setIsModalOpen(false)} />}
      >
        {isLoading ? (
          <Loader />
        ) : (
          <div className="ot-purchase-content flex flex-col">

            {/* Step 1: Network Selection */}
            {currentStep === 1 && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-16 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-[var(--ot-ink)] mb-1">Choose Your Network</h3>
                  <p className="text-sm text-[var(--ot-muted)]">Select your mobile network provider</p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3 max-w-sm mx-auto">
                  {availableNetworks.map(network => (
                    <button
                      key={network}
                      onClick={() => {
                        handleNetworkChange(network);
                      }}
                      className={`p-3 md:p-4 bg-[var(--ot-paper)] border-2 rounded-xl transition-all duration-200 hover:shadow-md active:scale-95 ${
                        selectedNetwork === network
                          ? 'border-blue-500 bg-[var(--ot-tint)] shadow-md'
                          : 'border-[var(--ot-line)] hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--ot-tint)] rounded-full flex items-center justify-center mx-auto mb-1 md:mb-2">
                          <FaSignal className="text-[var(--ot-accent)] text-base md:text-lg" />
                        </div>
                        <div className="text-base md:text-lg font-bold text-[var(--ot-ink)] mb-1">
                          {network.toUpperCase()}
                        </div>
                        <div className="text-xs text-[var(--ot-muted)]">
                          {selectedPlansData.plans[network]?.length || 0} plans
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
                        setDataReset(false); // Clear reset flag when proceeding
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
                        <span className="font-medium">{selectedNetwork.toUpperCase()}</span> selected.
                        {dataReset && (
                          <span className="text-orange-600 ml-1 block mt-1">
                            ⚠️ Previous selections (plan & phone) have been reset.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Data Plan Selection */}
            {currentStep === 2 && selectedNetwork && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-16 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-[var(--ot-ink)] mb-1">Choose Your Data Plan</h3>
                  <p className="text-sm text-[var(--ot-muted)]">Select a plan for {selectedNetwork.toUpperCase()}</p>
                </div>

                {/* Data Reset Notification */}
                {dataReset && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-xs">⚠️</span>
                      </div>
                      <div className="text-sm text-orange-800">
                        <span className="font-medium">Network changed</span> - Please select a new data plan for {selectedNetwork.toUpperCase()}.
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Plan Select Dropdown */}
                <div className="max-w-sm mx-auto">
                  <label className="block text-base font-semibold text-[var(--ot-ink)] mb-2">
                    Select Data Plan
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPlan?.planId || ''}
                      onChange={(e) => {
                        const planId = e.target.value;
                        const plan = networkPlans.find(p => p.planId === planId);
                        if (plan) {
                          setSelectedPlan(plan);
                          setDataReset(false); // Clear reset flag when new plan is selected
                          setCurrentStep(3);
                        }
                      }}
                      className="w-full px-3 py-3 border-2 border-[var(--ot-line)] rounded-lg text-base font-medium bg-[var(--ot-paper)] focus:border-blue-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">Choose a data plan...</option>
                      {networkPlans.map(plan => (
                        <option key={plan.planId} value={plan.planId}>
                          {plan.name} - {plan.dataAmount} • {plan.validity} • {formatNairaAmount(plan.finalPrice || plan.amount)}
                          {plan.discount > 0 && ` (Save ${formatNairaAmount(plan.discountAmount)})`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-[var(--ot-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Selected Plan Details */}
                  {selectedPlan && (
                    <div className="mt-3 p-3 bg-[var(--ot-tint)] rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-[var(--ot-tint)] rounded-lg flex items-center justify-center">
                          <FaWifi className="text-[var(--ot-accent)] text-sm" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--ot-ink)] text-sm">{selectedPlan.name}</h4>
                          <p className="text-xs text-[var(--ot-muted)]">
                            {selectedPlan.dataAmount} • {selectedPlan.validity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            selectedPlan.planType === 'SME' ? 'bg-purple-100 text-purple-800' :
                            selectedPlan.planType === 'Regular' ? 'bg-green-100 text-green-800' :
                            'bg-[var(--ot-tint)] text-[var(--ot-accent)]'
                          }`}>
                            {selectedPlan.planType}
                          </span>
                          <span>{selectedPlan.providerName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[var(--ot-accent)]">
                            {formatNairaAmount(selectedPlan.finalPrice || selectedPlan.amount)}
                          </div>
                          {selectedPlan.discount > 0 && (
                            <div className="text-xs text-red-600 font-medium">
                              Save {formatNairaAmount(selectedPlan.discountAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 bg-[var(--ot-bg)] text-[var(--ot-ink)] rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (selectedPlan) {
                        setCurrentStep(3);
                      }
                    }}
                    disabled={!selectedPlan}
                    className="px-4 py-2 bg-[#3057c5] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
                  <p className="text-sm text-[var(--ot-muted)]">Data will be sent to this number</p>
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
                    className="w-full p-4 bg-[var(--ot-paper)] border-2 border-[var(--ot-line)] rounded-xl transition-all duration-200 hover:shadow-md hover:border-blue-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--ot-tint)] rounded-lg flex items-center justify-center">
                        <FaUser className="text-[var(--ot-accent)] text-lg" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-[var(--ot-ink)] text-base">My registered number</div>
                        <div className="text-[var(--ot-muted)] text-sm">
                          {user?.phoneNumber ? formatPhoneNumberForDisplay(user.phoneNumber) : 'No registered number'}
                        </div>
                      </div>
                      <div className="text-[var(--ot-accent)]">
                        <FaChevronRight className="text-lg" />
                      </div>
                    </div>
                  </button>

                  {/* Custom Number Option */}
                  <button
                    onClick={() => setUseCustomPhone(true)}
                    className="w-full p-4 bg-[var(--ot-paper)] border-2 border-[var(--ot-line)] rounded-xl transition-all duration-200 hover:shadow-md hover:border-green-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaEdit className="text-green-600 text-lg" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-[var(--ot-ink)] text-base">Enter different number</div>
                        <div className="text-[var(--ot-muted)] text-sm">Use another phone number</div>
                      </div>
                      <div className="text-green-600">
                        <FaChevronRight className="text-lg" />
                      </div>
                    </div>
                  </button>

                  {/* Custom Phone Input */}
                  {useCustomPhone && (
                    <div className="bg-[var(--ot-paper)] p-4 rounded-xl border-2 border-[var(--ot-line)]">
                      <label className="block text-base font-semibold text-[var(--ot-ink)] mb-2">
                        Enter Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        className={`w-full px-3 py-3 border-2 rounded-lg text-base font-medium ${
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
                      <p className="text-xs text-[var(--ot-muted)] mt-2">
                        Enter a valid Nigerian phone number (e.g., +2348012345678, 08012345678, or 8012345678)
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setUseCustomPhone(false)}
                          className="flex-1 px-4 py-2 bg-[var(--ot-bg)] text-[var(--ot-ink)] rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors text-sm"
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
                          className="flex-1 px-4 py-2 bg-[#3057c5] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          Continue to PIN
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 bg-[var(--ot-bg)] text-[var(--ot-ink)] rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors text-sm"
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
                    className="px-4 py-2 bg-[#3057c5] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Continue to PIN
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Transaction PIN */}
            {currentStep === 4 && selectedNetwork && selectedPlan && phoneNumber && (
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
            {currentStep === 5 && selectedPlan && selectedNetwork && phoneNumber && transactionPin && (
              <div className="px-3 md:px-4 py-3 md:py-4 pb-12 md:pb-8">
                <div className="mb-3 md:mb-4 text-center">
                  <h3 className="text-lg md:text-xl font-bold text-[var(--ot-ink)] mb-1">Confirm Your Purchase</h3>
                  <p className="text-sm text-[var(--ot-muted)]">Review your selection and complete the purchase</p>
                </div>

                {/* Order Summary */}
                <div className="bg-[var(--ot-paper)] rounded-xl border-2 border-[var(--ot-line)] p-3 md:p-4 mb-3 md:mb-4">
                  <h4 className="text-sm md:text-base font-bold text-[var(--ot-ink)] mb-2 md:mb-3">Order Summary</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--ot-tint)] rounded-lg flex items-center justify-center">
                          <FaSignal className="text-[var(--ot-accent)] text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-[var(--ot-ink)] text-sm">Network</div>
                          <div className="text-xs text-[var(--ot-muted)]">{selectedNetwork.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaWifi className="text-green-600 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-[var(--ot-ink)] text-sm">Data Plan</div>
                          <div className="text-xs text-[var(--ot-muted)]">{selectedPlan.name}</div>
                          <div className="text-xs text-[var(--ot-muted)]">{selectedPlan.dataAmount} • {selectedPlan.validity}</div>
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

                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div className="font-medium text-[var(--ot-ink)] text-sm">Plan Amount</div>
                        <div className="text-sm text-[var(--ot-muted)]">{formatNairaAmount(selectedPlan.finalPrice || selectedPlan.amount)}</div>
                      </div>
                      {commissionAmount > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="font-medium text-green-600 text-sm">Commission Savings ({commissionRate}%)</div>
                          <div className="text-sm text-green-600">-{formatNairaAmount(commissionAmount)}</div>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-3 bg-[var(--ot-bg)] rounded-lg px-3">
                        <div className="font-bold text-[var(--ot-ink)] text-base">
                          {commissionAmount > 0 ? 'Amount to Pay' : 'Total Amount'}
                        </div>
                        <div className="text-xl font-bold text-[var(--ot-accent)]">
                          {formatNairaAmount(commissionAmount > 0 ? adjustedAmount : (selectedPlan.finalPrice || selectedPlan.amount))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 px-4 py-3 bg-[var(--ot-bg)] text-[var(--ot-ink)] rounded-lg font-medium hover:bg-[var(--ot-line)] transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={confirmPurchase}
                    disabled={isConfirming}
                    className="flex-1 px-4 py-3 bg-[#3057c5] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-sm"
                  >
                    {isConfirming ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <FaCreditCard className="text-sm" />
                        <span>
                          Pay {formatNairaAmount(commissionAmount > 0 ? adjustedAmount : (selectedPlan.finalPrice || selectedPlan.amount))}
                          {commissionAmount > 0 && (
                            <span className="text-xs block text-green-600">
                              (Save {formatNairaAmount(commissionAmount)})
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

export default DataPurchase;
