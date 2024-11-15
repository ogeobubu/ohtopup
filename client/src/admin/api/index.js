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
        console.error("Unauthorized request!");
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

export const getAllUsers = async (
  page = 1,
  limit = 10,
  search = "",
  role = ""
) => {
  try {
    const response = await instance.get(`/users`, {
      params: { page, limit, search, role },
    });
    return response?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching users");
  }
};
