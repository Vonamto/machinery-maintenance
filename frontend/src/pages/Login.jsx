// frontend/src/pages/Login.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, loading, isLoggedIn } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  // RTL handling for Arabic
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await login(username, password);
    if (res.ok) {
      navigate("/");
    } else {
      setError(res.message || t("auth.loginError"));
    }
  }

  function switchLanguage(lang) {
    i18n.changeLanguage(lang);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4">
      <div className="w-full max-w-md bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-8 text-white">
        
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛠️</div>
          <h1 className="text-2xl font-bold tracking-wide">
            {t("auth.loginTitle")}
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-1 text-gray-300">
              {t("auth.username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("auth.placeholderUsername")}
              required
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">
              {t("auth.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.placeholderPassword")}
              required
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed transition rounded-lg py-2.5 font-semibold tracking-wide"
          >
            {loading ? t("auth.loggingIn") : t("auth.login")}
          </button>
        </form>

        {/* Language Switch */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <button
            onClick={() => switchLanguage("en")}
            className={`mx-1 hover:text-cyan-400 transition ${
              i18n.language === "en" ? "text-cyan-400 font-semibold" : ""
            }`}
          >
            English
          </button>
          /
          <button
            onClick={() => switchLanguage("ar")}
            className={`mx-1 hover:text-cyan-400 transition ${
              i18n.language === "ar" ? "text-cyan-400 font-semibold" : ""
            }`}
          >
            العربية
          </button>
        </div>

        {/* Footer hint */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Machinery Maintenance System
        </div>
      </div>
    </div>
  );
}
