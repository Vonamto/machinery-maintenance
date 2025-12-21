// frontend/src/context/AuthContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin } from "../api/api";
import { useCache } from "./CacheContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { loadAll } = useCache();

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  async function login(username, password) {
    const res = await apiLogin(username, password);

    if (res?.status === "success") {
      setToken(res.token);
      setUser(res.user);

      // ✅ LOAD CACHE AFTER LOGIN (THIS FIXES EVERYTHING)
      await loadAll();

      return { ok: true };
    }

    return { ok: false, message: res?.message || "Login failed" };
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isLoggedIn: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
