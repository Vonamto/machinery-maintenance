// frontend/src/components/Navbar.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, Languages, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Detect mobile device
    const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Detect iOS (iPhone/iPad) and not already installed
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const standalone = window.navigator.standalone;
    setIsIOS(ios && !standalone);

    // Save Android/Chrome install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    // Hide button after install
    window.addEventListener("appinstalled", () => {
      setInstallPrompt(null);
      setIsIOS(false);
    });
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setInstallPrompt(null);
    }
  };

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

  if (location.pathname === "/login") return null;

  const fullName = user?.full_name || user?.username || "";

  return (
    <header className="bg-gray-900/90 backdrop-blur-lg text-white shadow-md flex items-center justify-between px-4 py-3 sticky top-0 z-50 border-b border-white/10">

      {/* Left: Logo + Welcome + Name */}
      <div className="flex items-center gap-3 max-w-[65%]">

        {/* Company Logo */}
        <img
          src="/logo.png"
          alt="Company Logo"
          className="h-8 w-auto shrink-0"
        />

        {/* Welcome Text */}
        <div className="flex flex-col sm:block">
          <span className="text-sm sm:text-lg font-semibold">
            👋 {t("navbar.welcome")},
          </span>
          <span
            className="text-cyan-400 text-sm sm:text-lg font-semibold break-words sm:truncate sm:max-w-[300px]"
            title={fullName}
          >
            {fullName}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">

        {/* Install App — Android (mobile only) */}
        {isMobile && installPrompt && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-2 rounded-lg transition text-sm"
            title="Install App"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Install App — iOS (mobile only) */}
        {isMobile && isIOS && (
          <div className="relative">
            <button
              onClick={() => setShowIOSHint((v) => !v)}
              className="flex items-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-2 rounded-lg transition text-sm"
              title="Install App"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Install App</span>
            </button>
            {showIOSHint && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-3 text-sm text-gray-200 z-50">
                Tap <strong className="text-cyan-400">Share</strong> then{" "}
                <strong className="text-cyan-400">"Add to Home Screen"</strong>
              </div>
            )}
          </div>
        )}

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
          <span className="hidden sm:inline">
            {t("navbar.dashboard")}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 sm:gap-2 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-2 rounded-lg transition text-sm"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">
            {t("navbar.logout")}
          </span>
        </button>
      </div>
    </header>
  );
}
