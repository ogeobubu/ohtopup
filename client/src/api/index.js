import axios from "axios";

const API_URL = "/api/users";

// Add this import for CSRF token fetching
let csrfToken = null;

// Function to fetch CSRF token from backend
const fetchCsrfToken = async () => {
  try {
    const response = await axios.get("/api/csrf-token", { withCredentials: true });
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return null;
  }
};

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensure cookies are sent
});

const getToken = () => {
  const token = localStorage.getItem("ohtopup-token");
  return token;
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
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);


// Optionally, refresh CSRF token on 403 error (invalid/expired token)
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data.message === "Invalid CSRF token"
    ) {
      csrfToken = null; // Reset token
      await fetchCsrfToken(); // Try to refresh
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
    throw new Error(error.response?.data?.message || "Error logging user");
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
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const getServices = async () => {
  try {
    const response = await instance.get(`/admin/services`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
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
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const getWallet = async () => {
  try {
    const response = await instance.get(`/wallet`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
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

export const getRanking = async () => {
  try {
    const response = await instance.post(`/rankings`);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching data");
  }
};

export const sendMessage = async (data) => {
  try {
    const response = await instance.post(`/chat/send-message`, data);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error sneding message");
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
