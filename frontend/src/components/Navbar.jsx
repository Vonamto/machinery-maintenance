// frontend/src/components/Navbar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home } from "lucide-react";

export default function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const goDashboard = () => navigate("/dashboard");

  // Hide Navbar on login page
  if (location.pathname === "/login") return null;

  return (
    <header className="bg-gray-900/90 backdrop-blur-lg text-white shadow-md flex justify-between items-center px-6 py-3 sticky top-0 z-50 border-b border-white/10">
      <h1 className="text-lg font-semibold">
        👋 Welcome, <span className="text-cyan-400">{user?.full_name || user?.username}</span>
      </h1>

      <div className="flex items-center gap-3">
        <button
          onClick={goDashboard}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition"
        >
          <Home size={18} />
          Dashboard
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}
