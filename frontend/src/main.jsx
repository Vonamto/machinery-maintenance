// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next"; // Import the provider
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CacheProvider } from "./context/CacheContext";
import i18n from "./i18n"; // Import your i18n configuration

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Wrap everything inside I18nextProvider */}
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <CacheProvider>
          <App />
        </CacheProvider>
      </AuthProvider>
    </I18nextProvider>
  </React.StrictMode>
);
