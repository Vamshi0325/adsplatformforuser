import axios from "axios";
import { API_ENDPOINTS, AUTH_STORAGE_KEYS } from "./api-config";

// Create Axios instance without baseURL (add if you want)
const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to auto-add auth token to headers
apiClient.interceptors.request.use(
  (config) => {
    // Get token from sessionStorage
    const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);

    if (token) {
      // Attach Authorization header for all requests
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request errors here
    return Promise.reject(error);
  }
);

export const authHandlers = {
  // Login: no auth needed here
  login: async (email, password) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        Email: email,
        Password: password,
      });

      // Save token if returned
      if (response.data.token) {
        sessionStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, response.data.token);
      }

      return response;
    } catch (error) {
      // console.error("Error logging in in auth-handlers:", error);
      throw error;
    }
  },

  // Signup: no auth needed
  signup: async (userData) => {
    try {
      const signupData = {
        Email: userData.Email,
        Username: userData.Username,
        Password: userData.Password,
        TelegramUsername: userData.TelegramUsername,
        Role: userData.Role,
      };

      const response = await apiClient.post(API_ENDPOINTS.SIGNUP, signupData);
      console.log("Signup response in auth-handlers:", response);

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Send OTP for forgot password
  sendOTP: async (email) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SEND_OTP, {
        email: email,
      });

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Verify OTP entered by user
  verifyOTP: async (email, otp) => {
    console.log("verifyOTP called with email:", email, "and OTP:", otp);

    try {
      const response = await apiClient.post(API_ENDPOINTS.VERIFY_OTP, {
        email: email,
        otp: Number(otp),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // OTP verify with Verification flag (query param)
  verifyOTPWithVerificationFlag: async (email, otp) => {
    console.log(
      "verifyOTPWithVerificationFlag called with email:",
      email,
      "OTP:",
      otp
    );

    try {
      const url = API_ENDPOINTS.VERIFY_OTP + "?Verification=EmailVerification";
      console.log("URL:", url);

      const response = await apiClient.post(url, {
        email: email,
        otp: Number(otp),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Reset password after OTP verification
  resetPassword: async (token, newPassword) => {
    console.log(
      "resetPassword called with token:",
      token,
      "and new password:",
      newPassword
    );

    try {
      const response = await apiClient.put(API_ENDPOINTS.RESET_PASSWORD, {
        token: token,
        newPassword: newPassword,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get profile — token auto-attached by interceptor
  getProfile: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_PROFILE);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        profileData
      );

      if (response.data?.user) {
        sessionStorage.setItem("userData", JSON.stringify(response.data.user));
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get user websites with optional pagination
  getUserWebsites: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_USER_WEBSITES, {
        params,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create app request
  createAppRequest: async (appData) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CREATE_APP_REQUEST,
        appData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Withdraw request
  withdrawRequest: async (withdrawData) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.WITHDRAW_REQUEST,
        withdrawData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get active networks
  getActiveNetworks: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_ACTIVE_NETWORKS);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.CHANGE_PASSWORD,
        passwordData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get user withdrawals with filters
  getUserWithdrawals: async ({
    page = 1,
    limit = 10,
    status,
    network,
    wallet,
    startDate,
    endDate,
  }) => {
    try {
      const params = { page, limit };
      if (status) params.status = status;
      if (network) params.network = network;
      if (wallet) params.wallet = wallet;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get(API_ENDPOINTS.GET_USER_WITHDRAWALS, {
        params,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get user stats with optional date filters
  getUserStats: async ({
    page = 1,
    limit = 10,
    startDate,
    endDate,
    website_id,
  }) => {
    try {
      const params = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (website_id) params.website_id = website_id;

      const response = await apiClient.get(API_ENDPOINTS.GET_USER_STATS, {
        params,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // GET_SUPPORT_DATA
  getSupportData: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_SUPPORT_DATA);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // SUPPORT_MAIL
  supportMail: async (subject, message) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SUPPORT_MAIL, {
        Subject: subject,
        Message: message,
      });
      return response;
    } catch (error) {
      console.log("error:", error);
      throw error;
    }
  },

  // Logout — remove token
  logout: () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    console.log("Logged out: Token removed");
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return Boolean(sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN));
  },

  // Simple token validation check (can be expanded)
  validateToken: async () => {
    try {
      const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
      return Boolean(token);
    } catch (error) {
      return false;
    }
  },
};
