import axios from "axios";

const API_URL = "/api/users";

// CSRF token management
let csrfToken = null;
let csrfTokenPromise = null;

// Function to fetch CSRF token from backend
const fetchCsrfToken = async () => {
  // If already fetching, return the existing promise
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // If we already have a token, return it
  if (csrfToken) {
    return csrfToken;
  }

  // Start fetching
  csrfTokenPromise = (async () => {
    try {
      const response = await axios.get("/api/csrf-token", { withCredentials: true });
      csrfToken = response.data.csrfToken;
      return csrfToken;
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
      return null;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
};

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensure cookies are sent
});

const getToken = () => {
  // Check current path to determine which token to use
  const currentPath = window.location.pathname;

  if (currentPath.startsWith('/admin')) {
    // On admin routes, use admin token
    return localStorage.getItem("ohtopup-admin-token");
  } else {
    // On user routes, use user token
    return localStorage.getItem("ohtopup-token");
  }
};

// Interceptor to attach CSRF token to requests
instance.interceptors.request.use(
  async (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach CSRF token for state-changing requests
    if (["post", "put", "patch", "delete"].includes(config.method)) {
      const token = await fetchCsrfToken();
      if (token) {
        config.headers["X-CSRF-Token"] = token;
      }
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);


// Handle response errors including auth and CSRF
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response) {
      if (error.response.status === 401) {
        if (error.response.data.message === "Invalid token") {
          localStorage.removeItem("ohtopup-token");
          window.location.href = "/login";
        }
      } else if (error.response.status === 403) {
        if (error.response.data.message === "Invalid CSRF token") {
          // Prevent infinite retry loop
          if (config && !config._csrfRetry) {
            config._csrfRetry = true;
            csrfToken = null;
            try {
              await fetchCsrfToken();
              if (csrfToken) {
                config.headers["X-CSRF-Token"] = csrfToken;
                return instance(config);
              }
            } catch (tokenError) {
              console.error("Failed to refresh CSRF token:", tokenError);
            }
          }
        } else if (error.response.data.message === "Invalid token") {
          localStorage.removeItem("ohtopup-token");
          window.location.href = "/login";
        }
      } else {
        console.error("Response Error:", error.response.data);
      }
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export const createUser = async (userData) => {
  try {
    const response = await instance.post(`/create`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error creating user");
  }
};

export const getReferrals = async (page = 1, limit = 10, search = "") => {
  try {
    const response = await instance.get(`/referrals`, {
      params: { page, limit, search },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching referrals");
  }
};

export const verifyUser = async (userData) => {
  try {
    const response = await instance.post(`/verify`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error creating user");
  }
};

export const resendCodeUser = async (userData) => {
  try {
    const response = await instance.post(`/resend-code`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error creating user");
  }
};

export const loginUser = async (userData) => {
  try {
    const response = await instance.post(`/login`, userData);
    return response?.data;
  } catch (error) {
    // Preserve the original error structure for proper error handling
    if (error.response?.data) {
      const serverError = new Error(error.response.data.message || "Error logging user");
      serverError.status = error.response.status;
      serverError.details = error.response.data;
      throw serverError;
    }
    throw error;
  }
};

export const forgotUser = async (userData) => {
  try {
    const response = await instance.post(`/forgot`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error creating user");
  }
};

export const resetUser = async (userData) => {
  try {
    const response = await instance.post(`/reset`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error creating user");
  }
};

export const resendResetCodeUser = async (userData) => {
  try {
    const response = await instance.post(`/resend-otp`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error creating user");
  }
};

export const getUser = async () => {
  try {
    const response = await instance.get(`/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const updateUser = async (userData) => {
  try {
    const response = await instance.patch(`/`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error updating user");
  }
};

export const deleteUser = async () => {
  try {
    const response = await instance.delete(`/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error deleting user");
  }
};

export const getServices = async () => {
  try {
    const response = await instance.get(`/admin/services`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching services");
  }
};

export const createDedicatedAccount = async (data) => {
  try {
    const response = await instance.post(
      `/wallet/create-dedicated-account`,
      data
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error creating dedicated account");
  }
};

export const getWallet = async () => {
  try {
    const response = await instance.get(`/wallet`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching wallet");
  }
};

export const getTransactions = async (
  type,
  page = 1,
  limit = 10,
  reference
) => {
  try {
    const response = await instance.get(`/transactions`, {
      params: { type, page, limit, reference },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response.data.message || "Error fetching transactions"
    );
  }
};

export const getTransactionDetails = async (requestId) => {
  try {
    const response = await instance.get(`/transactions/${requestId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error fetching transaction details"
    );
  }
};

export const getBanks = async () => {
  try {
    const response = await instance.get(`/banks`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const verifyBankAccount = async (data) => {
  try {
    const response = await instance.post(`/verify-account`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const withdrawFunds = async (data) => {
  try {
    const response = await instance.post(`/withdraw`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const withdrawFundsAuthorization = async (data) => {
  try {
    const response = await instance.post(`/withdraw/authorize`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const deleteBank = async (id) => {
  try {
    const response = await instance.post(`/bank`, {
      accountNumber: id,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const depositWallet = async (data) => {
  try {
    const response = await instance.post(`/deposit`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const verifyMonnifyTransaction = async (ref, id) => {
  try {
    const response = await instance.get(`/verify-payment/${ref}?userId=${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error verifying payment");
  }
};

export const verifyPaystackTransaction = async (ref) => {
  try {
    const response = await instance.get(`/verify-payment/${ref}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error verifying payment");
  }
};

export const purchaseAirtime = async (data) => {
  try {
    const response = await instance.post("/airtime", data);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error purchasing airtime");
  }
};

export const getDataVariationCodes = async (id) => {
  try {
    const response = await instance.get(`/data?serviceID=${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching data");
  }
};

export const getDataVariations = async (provider, serviceID) => {
  try {
    const response = await instance.get(`/data-variations`, {
      params: { provider, serviceID }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data variations");
  }
};

export const purchaseData = async (data) => {
  try {
    const response = await instance.post("/data", data);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error purchasing airtime");
  }
};

export const getServiceID = async (id) => {
  try {
    const response = await instance.get(`/service-id?identifier=${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching data");
  }
};

export const getAirtimeProviders = async () => {
  try {
    const response = await instance.get(`/airtime-providers`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching airtime providers");
  }
};

export const getDataVariationTVCodes = async (id) => {
  try {
    const response = await instance.get(`/cable?serviceID=${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching data");
  }
};

export const getCableName = async (id, data) => {
  try {
    const response = await instance.post(`/cable/verify`, {
      billersCode: data,
      serviceID: id,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching data");
  }
};

export const purchaseCable = async (data) => {
  try {
    const response = await instance.post("/cable", data);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response.data.message ||
        error.response.data.error ||
        "Error purchasing cable"
    );
  }
};

export const getServiceIDElectricity = async (id) => {
  try {
    const response = await instance.get(`/service-id?identifier=${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching data");
  }
};

export const getElectricityName = async (id, data, type) => {
  try {
    const response = await instance.post(`/electricity/verify`, {
      billersCode: data,
      serviceID: id,
      type,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching data");
  }
};

export const purchaseElectricity = async (data) => {
  try {
    const response = await instance.post("/electricity", data);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response.data.message ||
        error.response.data.error ||
        "Error purchasing electricity"
    );
  }
};

export const getAllUtilityTransactions = async (
  page = 1,
  limit = 10,
  type,
  requestId
) => {
  try {
    const params = { page, limit };
    if (type) {
      params.type = type;
    }
    if (type) {
      params.requestId = requestId;
    }

    const response = await instance.get(`/utility-transactions`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error fetching transactions"
    );
  }
};

export const redeemPoints = async (data) => {
  try {
    const response = await instance.post(`/redeem-points`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const joinWaitlist = async (data) => {
  try {
    const response = await instance.post(`/waitlist`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error saving data");
  }
};

export const subscribeNewsletter = async (data) => {
  try {
    const response = await instance.post(`/newsletter/subscribe`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error subscribing to newsletter");
  }
};

export const unsubscribeNewsletter = async (data) => {
  try {
    const response = await instance.post(`/newsletter/unsubscribe`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error unsubscribing from newsletter");
  }
};

export const sendNewsletter = async (data) => {
  try {
    const response = await instance.post(`/admin/newsletter/send`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error sending newsletter");
  }
};

export const getNewsletterSubscribers = async () => {
  try {
    const response = await instance.get(`/admin/newsletter/subscribers`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching newsletter subscribers");
  }
};

export const getRanking = async (period = 'weekly') => {
  try {
    const response = await instance.post(`/rankings`, { period });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const manualResetRankings = async () => {
  try {
    const response = await instance.post(`/admin/manual-reset-rankings`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error resetting rankings");
  }
};

export const exportRankingsToCSV = async (period = 'weekly') => {
  try {
    const response = await instance.get(`/admin/export-rankings-csv`, {
      params: { period },
      responseType: 'blob' // Important for file downloads
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error exporting rankings");
  }
};

export const sendMessage = async (data) => {
  try {
    const response = await instance.post(`/chat/send-message`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error sending message");
  }
};

export const getChatMessages = async (id) => {
  try {
    const response = await instance.get(`/chat/messages/${id}`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const getPricing = async () => {
  try {
    const response = await instance.get(`/pricing`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const getNotifications = async () => {
  try {
    const response = await instance.get(`/notifications`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const readNotification = async (id) => {
  try {
    const response = await instance.patch(`/notification/${id}`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const createTicket = async (data) => {
  try {
    const response = await instance.post(`/ticket`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error sending message");
  }
};

export const getTickets = async (page = 1, limit = 10, searchQuery = '') => {
  try {
    const response = await instance.get(`/tickets`, {
      params: { page, limit, ticketId: searchQuery }, 
    });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const replyTicket = async (data) => {
  try {
    const response = await instance.post(
      `/tickets/${data.ticketId}/reply`,
      data
    );
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error sending message");
  }
};

export const getRates = async () => {
  try {
    const response = await instance.get(`/rates`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const getUserAchievements = async () => {
  try {
    const response = await instance.get(`/achievements`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching achievements");
  }
};

// Dice Game APIs
export const playDiceGame = async () => {
  try {
    const response = await instance.post(`/dice/play`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error playing dice game");
  }
};


export const getUserGameHistory = async (params = {}) => {
  try {
    const response = await instance.get(`/dice/history`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching game history");
  }
};

export const getUserGameStats = async () => {
  try {
    const response = await instance.get(`/dice/stats`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching game stats");
  }
};

// Admin Reward Management APIs
export const getAllRewards = async (params = {}) => {
  try {
    const response = await instance.get(`/admin/rewards`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching rewards");
  }
};

export const createReward = async (rewardData) => {
  try {
    const response = await instance.post(`/admin/rewards`, rewardData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error creating reward");
  }
};

export const updateReward = async (id, rewardData) => {
  try {
    const response = await instance.put(`/admin/rewards/${id}`, rewardData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating reward");
  }
};

export const deleteReward = async (id) => {
  try {
    const response = await instance.delete(`/admin/rewards/${id}`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error deleting reward");
  }
};

export const assignRewardToUser = async (assignmentData) => {
  try {
    const response = await instance.post(`/admin/rewards/assign`, assignmentData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error assigning reward");
  }
};

export const getUserRewards = async (userId, params = {}) => {
  try {
    const response = await instance.get(`/admin/rewards/user/${userId}`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching user rewards");
  }
};

export const redeemReward = async (rewardId, redemptionData) => {
  try {
    const response = await instance.post(`/admin/rewards/${rewardId}/redeem`, redemptionData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error redeeming reward");
  }
};

export const redeemUserReward = async (rewardId) => {
  try {
    const response = await instance.post(`/rewards/${rewardId}/redeem`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error redeeming reward");
  }
};

export const getRewardAnalytics = async () => {
  try {
    const response = await instance.get(`/admin/rewards/analytics`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching analytics");
  }
};

// Provider Management APIs
export const getAllProviders = async () => {
  try {
    const response = await instance.get(`/admin/providers`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching providers");
  }
};

export const getDataProviders = async () => {
  try {
    const response = await instance.get(`/admin/data-providers`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data providers");
  }
};

export const getDefaultProvider = async () => {
  try {
    const response = await instance.get(`/admin/providers/default`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching default provider");
  }
};

export const getActiveProvider = async () => {
  try {
    const response = await instance.get(`/admin/active-provider`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching active provider");
  }
};

export const setActiveProvider = async (providerId) => {
  try {
    const response = await instance.patch(`/admin/providers/${providerId}/active`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error setting active provider");
  }
};

// Network Provider APIs
export const getAllNetworkProviders = async (params = {}) => {
  try {
    const response = await instance.get(`/admin/network-providers`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching network providers");
  }
};

export const createNetworkProvider = async (data) => {
  try {
    const response = await instance.post(`/admin/network-providers`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error creating network provider");
  }
};

export const updateNetworkProvider = async (id, data) => {
  try {
    const response = await instance.put(`/admin/network-providers/${id}`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating network provider");
  }
};

export const deleteNetworkProvider = async (id) => {
  try {
    const response = await instance.delete(`/admin/network-providers/${id}`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error deleting network provider");
  }
};

export const toggleNetworkProviderStatus = async (id) => {
  try {
    const response = await instance.patch(`/admin/network-providers/${id}/toggle`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error toggling network provider status");
  }
};

export const getActiveNetworkProviders = async (params = {}) => {
  try {
    const response = await instance.get(`/admin/network-providers/active`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching active network providers");
  }
};

export const createProvider = async (providerData) => {
  try {
    const response = await instance.post(`/admin/providers`, providerData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error creating provider");
  }
};

export const updateProvider = async (id, providerData) => {
  try {
    const response = await instance.put(`/admin/providers/${id}`, providerData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating provider");
  }
};

export const deleteProvider = async (id) => {
  try {
    const response = await instance.delete(`/admin/providers/${id}`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error deleting provider");
  }
};

export const setDefaultProvider = async (id) => {
  try {
    const response = await instance.patch(`/admin/providers/${id}/default`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error setting default provider");
  }
};

export const testProviderConnection = async (id) => {
  try {
    const response = await instance.post(`/admin/providers/${id}/test`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error testing provider connection");
  }
};

export const getProviderAnalytics = async () => {
  try {
    const response = await instance.get(`/admin/providers/analytics`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching provider analytics");
  }
};

export const bulkUpdateProviderStatus = async (data) => {
  try {
    const response = await instance.post(`/admin/providers/bulk-update`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error bulk updating providers");
  }
};

export const getAllDataPlans = async () => {
  try {
    const response = await instance.get(`/admin/providers/data-plans`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data plans");
  }
};

// Selected Data Plans APIs
export const getAllSelectedPlans = async (params = {}) => {
  try {
    const response = await instance.get(`/admin/selected-data-plans`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching selected plans");
  }
};

export const getSelectedPlansForUsers = async (params = {}) => {
  try {
    const response = await instance.get(`/admin/user/selected-data-plans`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching selected plans");
  }
};

export const selectDataPlan = async (planData) => {
  try {
    const response = await instance.post(`/admin/selected-data-plans`, planData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error selecting data plan");
  }
};

export const deselectDataPlan = async (planId, providerId) => {
  try {
    const response = await instance.delete(`/admin/selected-data-plans/${planId}`, {
      data: { providerId }
    });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error deselecting data plan");
  }
};

export const updateSelectedPlan = async (planId, updates) => {
  try {
    const response = await instance.put(`/admin/selected-data-plans/${planId}`, updates);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating selected plan");
  }
};

export const bulkUpdateSelectedPlans = async (action, plans) => {
  try {
    const response = await instance.post(`/admin/selected-data-plans/bulk`, {
      action,
      plans
    });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error bulk updating selected plans");
  }
};

export const getSelectedPlansStats = async () => {
  try {
    const response = await instance.get(`/admin/selected-data-plans/stats`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching selected plans stats");
  }
};


export const getAllGames = async (params = {}) => {
  try {
    const response = await instance.get(`/admin/dice/games`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching games");
  }
};

export const getGameStats = async () => {
  try {
    const response = await instance.get(`/admin/dice/stats`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching game stats");
  }
};

// Dice Game Settings APIs
export const getDiceGameSettings = async () => {
  try {
    const response = await instance.get(`/admin/dice/settings`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching dice game settings");
  }
};

export const updateDiceGameSettings = async (settingsData) => {
  try {
    const response = await instance.put(`/admin/dice/settings`, { settings: settingsData });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating dice game settings");
  }
};

export const resetDiceGameSettings = async () => {
  try {
    const response = await instance.post(`/admin/dice/settings/reset`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error resetting dice game settings");
  }
};

export const withdrawManagementFunds = async (withdrawalData) => {
  try {
    const response = await instance.post(`/admin/dice/withdraw`, withdrawalData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error processing withdrawal");
  }
};

export const verifyDiceBankAccount = async (accountNumber, bankCode) => {
  try {
    const response = await instance.post(`/admin/verify-bank-account`, {
      accountNumber,
      bankCode
    });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error verifying bank account");
  }
};

export const getManagementWallet = async () => {
  try {
    const response = await instance.get(`/admin/dice/wallet`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching management wallet");
  }
};
