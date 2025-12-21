// frontend/src/main.jsx

import React from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import App from "./App";
import "./index.css";

import { CacheProvider } from "./context/CacheContext";
import { AuthProvider } from "./context/AuthContext";
import i18n from "./i18n";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      {/* ✅ Cache MUST wrap Auth */}
      <CacheProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </CacheProvider>
    </I18nextProvider>
  </React.StrictMode>
);
