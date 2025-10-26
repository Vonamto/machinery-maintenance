// frontend/src/pages/Requests/GreaseOil/index.jsx
import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Droplets, ArrowLeft } from "lucide-react";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../context/AuthContext";

export default function GreaseOilMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check role for access (Mechanic, Supervisor, Driver)
  if (user && !["Supervisor", "Mechanic", "Driver"].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
          <p className="text-gray-300">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Request Grease/Oil Service",
      description: "Submit a new grease or oil service request",
      icon: <Droplets className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/requests/grease-oil/form",
      gradient: "from-amber-600 to-orange-500",
      glow: "shadow-[0_0_15px_2px_rgba(251,146,60,0.6)]",
    },
    {
      title: "Current Grease/Oil Requests",
      description: "View and manage pending requests",
      icon: <Droplets className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/requests/grease-oil/current",
      gradient: "from-amber-700 to-yellow-600",
      glow: "shadow-[0_0_15px_2px_rgba(251,146,60,0.6)]",
    },
    {
      title: "Grease/Oil Requests History",
      description: "View completed or rejected requests",
      icon: <Droplets className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/requests/grease-oil/history",
      gradient: "from-amber-800 to-yellow-700",
      glow: "shadow-[0_0_15px_2px_rgba(251,146,60,0.6)]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
          Back
        </button>

        <h1 className="text-3xl font-bold text-center mb-8">Grease & Oil Requests</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <Link key={index} to={card.link}>
              <div className={`p-6 rounded-2xl bg-gradient-to-br ${card.gradient} ${card.glow} shadow-xl transition-transform group hover:scale-[1.02]`}>
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-black/20 mb-4">
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-white drop-shadow-md">{card.title}</h2>
                  <p className="text-gray-100/90 text-sm mt-2">{card.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Outlet for nested routes (Form, Current, History) */}
        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
