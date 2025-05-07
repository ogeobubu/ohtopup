import axios from "axios";

const API_URL = "/api/users/admin";

const instance = axios.create({
  baseURL: API_URL,
});

const getToken = () => {
  const token = localStorage.getItem("ohtopup-admin-token");
  return token;
};

instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        if (error.response.data.message === "Invalid token") {
          localStorage.removeItem("ohtopup-admin-token");
          window.location.href = "/admin";
        }
      } else if (error.response.status === 403) {
        if (error.response.data.message === "Invalid token") {
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
    throw new Error(error.response?.data?.message || "Error logging user");
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
    throw new Error(error.response.data.message || "Error fetching user");
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
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const getWallets = async (page = 1, limit = 10) => {
  try {
    const response = await instance.get(`/wallets`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
  }
};

export const toggleWallet = async (id) => {
  try {
    const response = await instance.patch(`/wallets/${id}/toggle`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
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
    const response = await instance.get(
      `/data/toggle?variation_code=${variation_code}&serviceID=${serviceID}`
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
