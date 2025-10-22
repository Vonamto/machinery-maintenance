// frontend/src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import CONFIG from "./config";

function Home() {
  const [backendMessage, setBackendMessage] = useState("Loading...");

  useEffect(() => {
    fetch(`${CONFIG.BACKEND_URL}/`)
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.message))
      .catch(() => setBackendMessage("Failed to connect to backend"));
  }, []);

  return (
    <div style={{ fontFamily: "Arial", textAlign: "center", marginTop: 40 }}>
      <h1>Machinery Maintenance App</h1>
      <p>English / العربية (toggle coming later)</p>
      <hr style={{ width: 300 }} />
      <h3>Backend Test:</h3>
      <p>{backendMessage}</p>

      <div style={{ marginTop: 20 }}>
        <Link to="/login">
          <button style={{ padding: "8px 12px" }}>Go to Login</button>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
