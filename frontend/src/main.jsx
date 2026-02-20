// frontend/src/main.jsx
import { registerSW } from 'virtual:pwa-register';
registerSW({ onNeedRefresh() {}, onOfflineReady() {} });

import React from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CacheProvider } from "./context/CacheContext";
import i18n from "./i18n";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <CacheProvider>
          <App />
        </CacheProvider>
      </AuthProvider>
    </I18nextProvider>
  </React.StrictMode>
);
