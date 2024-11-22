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
      console.log(error);
      if (error.response.status === 401) {
        console.error("Response Error:", error.response.data);
      } else if (error.response.status === 403) {
        window.location.href = "/login";
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

export const getAllUsersNotifications = async (userData) => {
  try {
    const response = await instance.get(`/notifications`, userData);
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error logging user");
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

export const getWallets = async () => {
  try {
    const response = await instance.get(`/wallets`);
    return response.data.data;
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

export const getAllTransactions = async () => {
  try {
    const response = await instance.get(`/transactions`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error fetching user");
  }
};
