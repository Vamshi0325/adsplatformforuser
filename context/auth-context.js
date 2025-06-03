"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authHandlers } from "@/services/api-handlers";
import { AUTH_STORAGE_KEYS } from "@/services/api-config";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // loading while checking auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch and set user from API using token
  const fetchAndSetUser = async (token) => {
    try {
      const profileRes = await authHandlers.getProfile(token); // token auto-attached by interceptor
      console.log("profileRes:", profileRes);

      if (profileRes.status === 200) {
        setUser(profileRes.data);
        setIsAuthenticated(true);
        return profileRes.data;
      }
      throw new Error("Invalid profile response");
    } catch (error) {
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  };

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        // router.push("/auth/login");
        return;
      }

      const userData = await fetchAndSetUser(token);

      if (!userData) {
        router.push("/auth/login");
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Login function
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authHandlers.login(email, password);
      if (response && response.status === 200) {
        await fetchAndSetUser(response.data.token);
        router.push("/dashboard/tabs/my-sites");
        setIsLoading(false);
        return response;
      } else {
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      setIsLoading(false);      
      throw error;
    }
  };

  // In auth-context.js (signup function)
  const signup = async (userData) => {
    try {
      const response = await authHandlers.signup(userData);
      console.log("Signup response in auth-context:", response);

      if (response && response.status === 201) {
        router.push("/auth/login");
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  const refreshUserData = async () => {
    const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
    if (!token) return null;
    return fetchAndSetUser(token);
  };

  // Logout function
  const logout = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    setUser(null);
    setIsAuthenticated(false);
    router.push("/index.html");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
