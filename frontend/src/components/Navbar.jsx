// frontend/src/components/Navbar.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/login");
  };

  const goDashboard = () => navigate("/");

  const switchLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  // Hide Navbar on login page
  if (location.pathname === "/login") return null;

  return (
    <header className="bg-gray-900/90 backdrop-blur-lg text-white shadow-md flex items-center justify-between px-4 py-3 sticky top-0 z-50 border-b border-white/10">
      
      {/* Left: Welcome */}
      <h1 className="text-sm sm:text-lg font-semibold truncate max-w-[50%]">
        👋 {t("navbar.welcome")},{" "}
        <span className="text-cyan-400">
          {user?.full_name || user?.username}
        </span>
      </h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Language Switch */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Switch language"
          >
            <Languages size={20} />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden text-sm">
              <button
                onClick={() => switchLanguage("en")}
                className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition ${
                  i18n.language === "en" ? "text-cyan-400 font-semibold" : ""
                }`}
              >
                English
              </button>
              <button
                onClick={() => switchLanguage("ar")}
                className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition ${
                  i18n.language === "ar" ? "text-cyan-400 font-semibold" : ""
                }`}
              >
                العربية
              </button>
            </div>
          )}
        </div>

        {/* Dashboard */}
        <button
          onClick={goDashboard}
          className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-2 rounded-lg transition text-sm"
        >
          <Home size={16} />
          <span className="hidden sm:inline">{t("navbar.dashboard")}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 sm:gap-2 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-2 rounded-lg transition text-sm"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">{t("navbar.logout")}</span>
        </button>
      </div>
    </header>
  );
}
