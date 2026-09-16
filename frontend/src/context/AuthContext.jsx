import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("recoverlens_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("recoverlens_token"));
  const [loading, setLoading] = useState(false);

  const setAuthSession = (tokenData) => {
    localStorage.setItem("recoverlens_token", tokenData.access_token);
    const userInfo = {
      id: tokenData.user_id,
      role: tokenData.role,
      patient_id: tokenData.patient_id,
      care_team_id: tokenData.care_team_id,
      full_name: tokenData.full_name,
      language_preference: tokenData.language_preference,
    };
    localStorage.setItem("recoverlens_user", JSON.stringify(userInfo));
    setToken(tokenData.access_token);
    setUser(userInfo);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setAuthSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role, code = null) => {
    setLoading(true);
    try {
      const data = await api.demoLogin(role, code);
      setAuthSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("recoverlens_token");
    localStorage.removeItem("recoverlens_user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        demoLogin,
        logout,
        isAuthenticated: Boolean(token && user),
        isPatient: user?.role === "patient",
        isCareTeam: user?.role === "care_team",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
