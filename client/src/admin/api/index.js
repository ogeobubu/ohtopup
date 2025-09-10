import axios from "axios";

const API_URL = "/api/users/admin";

// Add CSRF token fetching for admin routes
let csrfToken = null;
let isFetchingToken = false;

const fetchCsrfToken = async () => {
  if (isFetchingToken) {
    // Wait for ongoing fetch to complete
    while (isFetchingToken) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return csrfToken;
  }

  if (csrfToken) {
    console.log("Using cached CSRF token");
    return csrfToken;
  }

  isFetchingToken = true;
  try {
    console.log("Fetching new CSRF token");
    const response = await axios.get("/api/csrf-token", { withCredentials: true });
    csrfToken = response.data.csrfToken;
    console.log("CSRF token fetched successfully");
    return csrfToken;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return null;
  } finally {
    isFetchingToken = false;
  }
};

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensure cookies are sent
});

const getToken = () => {
  const token = localStorage.getItem("ohtopup-admin-token");
  return token;
};

instance.interceptors.request.use(
  async (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach CSRF token for state-changing requests (except login)
    if (["post", "put", "patch", "delete"].includes(config.method) && !config.url?.includes('/login')) {
      console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
      if (!csrfToken) {
        console.log("No CSRF token cached, fetching...");
        try {
          await fetchCsrfToken();
        } catch (error) {
          console.error("Failed to fetch CSRF token:", error);
        }
      }
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
        console.log("CSRF token attached to request");
      } else {
        console.log("No CSRF token available");
      }
    } else if (config.url?.includes('/login')) {
      console.log(`Making ${config.method.toUpperCase()} request to ${config.url} (CSRF skipped)`);
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error.config;

    if (error.response) {
      if (error.response.status === 401) {
        if (error.response.data.message === "Invalid token") {
          localStorage.removeItem("ohtopup-admin-token");
          window.location.href = "/admin";
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
          localStorage.removeItem("ohtopup-admin-token");
          window.location.href = "/admin";
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

export const loginAdmin = async (userData) => {
  try {
    const response = await instance.post(`/login`, userData);
    return response?.data;
  } catch (error) {
    console.error("Admin login error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Error logging in");
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

export const getUser = async () => {
  try {
    const response = await instance.get(`/`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const updateAdmin = async (userData) => {
  try {
    const response = await instance.patch(`/`, userData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const getAllUsers = async (
  page = 1,
  limit = 10,
  search = "",
  role = "",
  status = "active"
) => {
  try {
    const response = await instance.get(`/users`, {
      params: { page, limit, search, role, status },
    });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching users");
  }
};

export const getUserAnalytics = async () => {
  try {
    const response = await instance.get(`/users/analytics`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await instance.patch(`/users/${id}`, userData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const createNotification = async (userData) => {
  try {
    const response = await instance.post(`/notifications`, userData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const getAllUsersNotifications = async ({ page, username }) => {
  try {
    const response = await instance.get(`/notifications`, {
      params: {
        page,
        username,
      },
    });
    return response?.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error fetching notifications"
    );
  }
};

export const deleteNotification = async (id) => {
  try {
    const response = await instance.delete(`/notifications/${id}`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const createService = async (data) => {
  try {
    const response = await instance.post(`/services`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error creating service");
  }
};

export const updateService = async (id, data) => {
  try {
    const response = await instance.patch(`/services/${id}`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const deleteService = async (id) => {
  try {
    const response = await instance.delete(`/services/${id}`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const getServices = async () => {
  try {
    const response = await instance.get(`/services`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const getAllServices = async () => {
  try {
    const response = await instance.get(`/all-services`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const createWallet = async (id) => {
  try {
    const response = await instance.post(`/wallet`, {
      userId: id,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error creating wallet");
  }
};

export const depositWallet = async (id, data) => {
  try {
    const response = await instance.post(`/wallet/deposit`, {
      userId: id,
      amount: data,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error depositing to wallet");
  }
};

export const getWallets = async (page = 1, limit = 10) => {
  try {
    const response = await instance.get(`/wallets`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching wallets");
  }
};

export const toggleWallet = async (id) => {
  try {
    const response = await instance.patch(`/wallets/${id}/toggle`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error toggling wallet");
  }
};

export const getAllTransactions = async (
  page = 1,
  limit = 10,
  type = null,
  reference = null
) => {
  try {
    const response = await instance.get(`/transactions`, {
      params: { page, limit, type, reference },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response.data.message || "Error fetching transactions"
    );
  }
};

export const getAllUtilityTransactions = async (
  page = 1,
  limit = 10,
  type,
  requestId,
  userId
) => {
  try {
    const params = { page, limit };
    if (type) {
      params.type = type;
    }
    if (requestId) {
      params.requestId = requestId;
    }
    if (userId) {
      params.userId = userId;
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

export const getUtilityAnalytics = async () => {
  try {
    const response = await instance.get(`/utility-analytic`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const addPoint = async (data) => {
  try {
    const response = await instance.post(`/add-point`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const getWaitlist = async (page = 1, limit = 10, search = "") => {
  try {
    const response = await instance.get(`/waitlist`, {
      params: { page, limit, search },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching waitlist");
  }
};

export const sendWaitlist = async (data) => {
  try {
    const response = await instance.post(`/waitlist/send`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error sending data");
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

export const saveData = async (data) => {
  try {
    const response = await instance.post(`/save-data`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error saving data");
  }
};

export const getSavedVariations = async (id) => {
  try {
    const response = await instance.get(`/data/variations?serviceID=${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching data");
  }
};

export const toggleData = async (variation_code, serviceID) => {
  try {
    const response = await instance.patch(
      `/data/toggle`,
      { variation_code, serviceID }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error toggling variation");
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

export const setDetails = async () => {
  try {
    const response = await instance.post(`/save-company-contact`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error setting data");
  }
};

export const updateDetails = async () => {
  try {
    const response = await instance.put(`/save-company-contact`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error setting data");
  }
};

export const getTickets = async (page = 1, limit = 10, searchQuery = "") => {
  try {
    const response = await instance.get(`/tickets`, {
      params: { page, limit, searchQuery },
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

export const updateTicket = async (id, data) => {
  try {
    const response = await instance.patch(`/tickets/${id}`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating data");
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

export const getRates = async () => {
  try {
    const response = await instance.get(`/rates`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const setRates = async (data) => {
  try {
    const response = await instance.post(`/rates`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error setting data");
  }
};

export const postTweetToX = async (text) => {
  try {
    const response = await instance.post("/x/post-to-x", { text });
    return response?.data;
  } catch (error) {
    console.error("Error posting tweet:", error);
    throw new Error(
      error.response?.data?.message || "Error posting tweet to X"
    );
  }
};

export const triggerTelcoRepost = async () => {
  try {
    const response = await instance.post("/x/trigger-repost");
    return response?.data;
  } catch (error) {
    console.error("Error triggering repost:", error);
    throw new Error(
      error.response?.data?.message || "Error triggering telco repost"
    );
  }
};

export const initiateXAuth = () => {
  const authUrl = `${instance.defaults.baseURL}/auth/x`;
  console.log("Opening new tab for X authentication:", authUrl);
  window.open(authUrl, "_blank");
};

export const getRandomContent = async () => {
  try {
    const response = await instance.get("/ai/random-content");
    return response?.data;
  } catch (error) {
    console.error(error);
  }
};

export const getUtilityBalance = async () => {
  try {
    const response = await instance.get("/utility-balance");
    return response?.data;
  } catch (error) {
    console.error(error);
  }
};

export const requeryTransaction = async (data) => {
  try {
    const response = await instance.post(`/requery-transaction`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
  }
};

export const getNewsletterStats = async () => {
  try {
    const response = await instance.get(`/newsletter/stats`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching newsletter stats");
  }
};

export const getNewsletterActivity = async (limit = 5) => {
  try {
    const response = await instance.get(`/newsletter/activity`, {
      params: { limit }
    });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching newsletter activity");
  }
};

export const getSystemLogs = async (params = {}) => {
  try {
    const response = await instance.get(`/logs`, { params });
    const data = response?.data;

    // Transform the response to match frontend expectations
    return {
      logs: data.logs || [],
      total: data.pagination?.total || 0,
      currentPage: data.pagination?.page || 1,
      totalPages: data.pagination?.pages || 1
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching system logs");
  }
};

export const getLogStats = async () => {
  try {
    const response = await instance.get(`/logs/stats`);
    const data = response?.data;

    // Transform stats to match frontend expectations
    const stats = data.stats || [];
    const errorCount = stats.find(s => s._id === 'error')?.total || 0;
    const warningCount = stats.find(s => s._id === 'warning')?.total || 0;
    const infoCount = stats.find(s => s._id === 'info')?.total || 0;
    const debugCount = stats.find(s => s._id === 'debug')?.total || 0;

    return {
      errorCount,
      warningCount,
      infoCount,
      debugCount,
      totalLogs: errorCount + warningCount + infoCount + debugCount,
      recentLogs: data.recentLogs || 0,
      recentErrors: data.recentErrors || 0
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching log stats");
  }
};

export const cleanupLogs = async (days = 30) => {
  try {
    const response = await instance.delete(`/logs/cleanup`, {
      data: { days }
    });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error cleaning up logs");
  }
};

// Reward Settings API functions
export const getRewardSettings = async () => {
  try {
    const response = await instance.get(`/rewards/settings`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching reward settings");
  }
};

export const updateRewardSettings = async (settings) => {
  try {
    const response = await instance.put(`/rewards/settings`, { settings });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating reward settings");
  }
};

export const resetRewardSettings = async () => {
  try {
    const response = await instance.post(`/rewards/settings/reset`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error resetting reward settings");
  }
};

export const getRewardSystemStats = async () => {
  try {
    const response = await instance.get(`/rewards/stats`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching reward system stats");
  }
};

export const bulkUpdateRewardStatus = async (rewardIds, isActive) => {
  try {
    const response = await instance.post(`/rewards/bulk-update`, { rewardIds, isActive });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error bulk updating rewards");
  }
};

// Electricity Settings API functions
export const getElectricitySettings = async () => {
  try {
    const response = await instance.get(`/electricity/settings`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching electricity settings");
  }
};

export const updateElectricitySettings = async (settings) => {
  try {
    const response = await instance.put(`/electricity/settings`, { settings });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating electricity settings");
  }
};

export const resetElectricitySettings = async () => {
  try {
    const response = await instance.post(`/electricity/settings/reset`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error resetting electricity settings");
  }
};

export const getAvailableDiscos = async () => {
  try {
    const response = await instance.get(`/electricity/discos`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching available discos");
  }
};

// VTPass Credential Management API functions
export const getVTPassCredentials = async () => {
  try {
    const response = await instance.get(`/vtpass/credentials`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching VTPass credentials");
  }
};

export const updateVTPassCredentials = async (credentials) => {
  try {
    const response = await instance.put(`/vtpass/credentials`, credentials);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating VTPass credentials");
  }
};

// ClubKonnect Credential Management API functions
export const getClubKonnectCredentials = async () => {
  try {
    const response = await instance.get(`/clubkonnect/credentials`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching ClubKonnect credentials");
  }
};

export const updateClubKonnectCredentials = async (credentials) => {
  try {
    const response = await instance.put(`/clubkonnect/credentials`, credentials);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating ClubKonnect credentials");
  }
};

// Wallet Settings API functions
export const getWalletSettings = async () => {
  try {
    const response = await instance.get(`/wallet/settings`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching wallet settings");
  }
};

export const updateWalletSettings = async (settings) => {
  try {
    const response = await instance.put(`/wallet/settings`, settings);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating wallet settings");
  }
};

export const resetWalletSettings = async () => {
  try {
    const response = await instance.post(`/wallet/settings/reset`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error resetting wallet settings");
  }
};

// Withdrawal Management API functions
export const getWithdrawalsForAdmin = async (params = {}) => {
  try {
    const response = await instance.get(`/withdrawals`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching withdrawals");
  }
};

export const approveWithdrawal = async (id, reason = null) => {
  try {
    const response = await instance.put(`/withdrawals/${id}/approve`, { reason });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error approving withdrawal");
  }
};

export const rejectWithdrawal = async (id, reason) => {
  try {
    const response = await instance.put(`/withdrawals/${id}/reject`, { reason });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error rejecting withdrawal");
  }
};

export const processWithdrawal = async (id, reason = null) => {
  try {
    const response = await instance.put(`/withdrawals/${id}/process`, { reason });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error processing withdrawal");
  }
};

export const completeWithdrawal = async (id, reason = null) => {
  try {
    const response = await instance.put(`/withdrawals/${id}/complete`, { reason });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error completing withdrawal");
  }
};

export const failWithdrawal = async (id, reason) => {
  try {
    const response = await instance.put(`/withdrawals/${id}/fail`, { reason });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error failing withdrawal");
  }
};

export const retryWithdrawal = async (id, reason = null) => {
  try {
    const response = await instance.put(`/withdrawals/${id}/retry`, { reason });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error retrying withdrawal");
  }
};

export const getWithdrawalAuditLogs = async (params = {}) => {
  try {
    const response = await instance.get(`/withdrawals/audit-logs`, { params });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching audit logs");
  }
};
