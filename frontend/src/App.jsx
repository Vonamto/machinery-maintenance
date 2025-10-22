// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import CONFIG from "./config";

function Home() {
  const [backendMessage, setBackendMessage] = useState("Checking connection...");

  useEffect(() => {
    fetch(`${CONFIG.BACKEND_URL}/`)
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.message))
      .catch(() => setBackendMessage("⚠️ Failed to connect to backend"));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-lg w-full">
        <h1 className="text-3xl font-bold mb-3 text-blue-700">
          Machinery Maintenance App
        </h1>

        <p className="text-gray-500 mb-6">English / العربية (coming soon)</p>

        <hr className="mb-6 border-gray-200" />

        <h3 className="text-lg font-semibold mb-2">Backend Test:</h3>
        <p
          className={`text-sm ${
            backendMessage.includes("successfully")
              ? "text-green-600"
              : backendMessage.includes("⚠️")
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {backendMessage}
        </p>

        <div className="mt-8">
          <Link to="/login">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Go to Login
            </button>
          </Link>
        </div>
      </div>

      <footer className="mt-8 text-sm text-gray-400">
        Powered by Vite + Tailwind + Flask (Render)
      </footer>
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
