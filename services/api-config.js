// Base URL for API requests
// export const BASE_URL = "http://192.168.7.243:3002/api";
export const BASE_URL = "https://adsplatformback.strtesting.com/api";

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: BASE_URL,
  //POST
  LOGIN: `${BASE_URL}/auth/login`,
  SIGNUP: `${BASE_URL}/auth/signup`,
  CREATE_APP_REQUEST: `${BASE_URL}/user/createappRequest`,
  WITHDRAW_REQUEST: `${BASE_URL}/user/withdrawrequest`,

  SEND_OTP: `${BASE_URL}/auth/request-reset`,
  VERIFY_OTP: `${BASE_URL}/auth/verify-otp`,
  RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
  SUPPORT_MAIL: `${BASE_URL}/user/supportmail`,

  // PUT
  UPDATE_PROFILE: `${BASE_URL}/auth/updateprofile`,
  CHANGE_PASSWORD: `${BASE_URL}/auth/changepassword`,

  // GET
  GET_PROFILE: `${BASE_URL}/auth/getprofile`,
  GET_USER_WEBSITES: `${BASE_URL}/user/getuserwebsites`,
  GET_ACTIVE_NETWORKS: `${BASE_URL}/user/getactivenetworks`,
  GET_USER_WITHDRAWALS: `${BASE_URL}/user/getuserwithdrawals`,
  GET_USER_STATS: `${BASE_URL}/user/getuserstats`,
  GET_SUPPORT_DATA: `${BASE_URL}/user/getSupportdata`,
};

// Authentication storage keys
export const AUTH_STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "user_data",
};
