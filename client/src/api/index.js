import axios from "axios";

const API_URL = "/api/users";

const instance = axios.create({
  baseURL: API_URL,
});

const getToken = () => {
  const token = localStorage.getItem('ohtopup-token');
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
    console.error('Request Error:', error);
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
        console.error('Unauthorized request!');
      } else {
        console.error('Response Error:', error.response.data);
      }
    } else {
      console.error('Error:', error.message);
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
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Error logging user");
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
    throw new Error(error.response.data.message || "Error fetching user"); // More specific error message
  }
};