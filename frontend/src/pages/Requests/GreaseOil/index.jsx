// frontend/src/pages/Requests/GreaseOil/index.jsx
import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets, Package, Clock, History, ArrowLeft } from "lucide-react"; // Updated icons import
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

  // Updated cards with consistent style and appropriate icons
  const cards = [
    {
      title: "Request Grease/Oil Service",
      description: "Submit a new grease or oil service request",
      icon: <Droplets className="w-10 h-10 text-white drop-shadow-md" />, // Changed icon to Droplets for oil/grease
      link: "/requests/grease-oil/form",
      gradient: "from-blue-600 to-cyan-500", // Consistent style (or could change to amber if preferred)
      glow: "shadow-[0_0_15px_2px_rgba(59,130,246,0.6)]", // Consistent style (or could change to amber if preferred)
    },
    {
      title: "Current Grease/Oil Requests",
      description: "View and manage pending requests",
      icon: <Clock className="w-10 h-10 text-white drop-shadow-md" />, // Changed icon
      link: "/requests/grease-oil/current",
      gradient: "from-amber-600 to-orange-500", // Consistent style
      glow: "shadow-[0_0_15px_2px_rgba(251,146,60,0.6)]", // Consistent style
    },
    {
      title: "Grease/Oil Requests History",
      description: "View completed or rejected requests",
      icon: <History className="w-10 h-10 text-white drop-shadow-md" />, // Changed icon
      link: "/requests/grease-oil/history",
      gradient: "from-emerald-600 to-green-500", // Consistent style
      glow: "shadow-[0_0_15px_2px_rgba(34,197,94,0.6)]", // Consistent style
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="p-6"> {/* Consistent padding */}
        {/* Back Button - Consistent style */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Page Header - Updated gradient to amber/orange for oil/grease theme */}
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
          Grease & Oil Requests {/* Updated title */}
        </h1>

        {/* Cards Grid - Consistent layout */}
        <div className="grid gap-8 sm:grid-cols-3">
          {cards.map((card) => ( // Removed index, used card.title as key
            <Link to={card.link} key={card.title}>
              {/* Card - Consistent styling using Card component */}
              <Card
                className={`rounded-2xl bg-gradient-to-br ${card.gradient} ${card.glow} hover:scale-[1.04] hover:brightness-110 transition-all duration-300 border border-white/10`}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  {/* Icon container - Consistent styling */}
                  <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-white drop-shadow-md">{card.title}</h2>
                  <p className="text-gray-100/90 text-sm">{card.description}</p>
                </CardContent>
              </Card>
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
