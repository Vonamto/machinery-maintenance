// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  ClipboardList,
  Droplets,
  Brush,      // ✅ replaced Broom with Brush
  Truck,
  LogOut,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const cards = [
    {
      title: "Maintenance Log",
      color: "bg-blue-100 text-blue-800",
      icon: <Wrench size={28} />,
    },
    {
      title: "Requests Parts",
      color: "bg-yellow-100 text-yellow-800",
      icon: <ClipboardList size={28} />,
    },
    {
      title: "Grease / Oil Requests",
      color: "bg-green-100 text-green-800",
      icon: <Droplets size={28} />,
    },
    {
      title: "Cleaning Log",
      color: "bg-teal-100 text-teal-800",
      icon: <Brush size={28} />,   // ✅ updated
    },
    {
      title: "Equipment List",
      color: "bg-purple-100 text-purple-800",
      icon: <Truck size={28} />,
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome, {user.full_name || user.username}
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </header>

      {/* Cards Grid */}
      <main className="flex-1 p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.color} rounded-2xl shadow hover:shadow-lg transition cursor-pointer p-6 flex flex-col items-center justify-center text-center`}
            onClick={() => alert(`${card.title} coming soon`)}
          >
            <div className="mb-3">{card.icon}</div>
            <h2 className="text-lg font-semibold">{card.title}</h2>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-400 text-sm p-4">
        Machinery Maintenance System © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
