// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { CacheProvider } from "./context/CacheContext";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CacheProvider>
        <App />
      </CacheProvider>
    </AuthProvider>
  </React.StrictMode>
);
