// frontend/src/pages/Cleaning/index.jsx
import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets, History as HistoryIcon, ClipboardPlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function CleaningIndex() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || "Guest";

  // Define cards based on user role
  const cards = [
    {
      title: "Cleaning Log Form",
      description: "Record a new cleaning activity",
      icon: <ClipboardPlus className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/cleaning/form",
      allowed: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"], // Adjust roles as needed
      gradient: "from-sky-600 to-cyan-500",
      glow: "shadow-[0_0_15px_2px_rgba(56,189,248,0.6)]", // sky glow
    },
    {
      title: "Cleaning History",
      description: "View all recorded cleaning activities",
      icon: <HistoryIcon className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/cleaning/history",
      allowed: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"], // Adjust roles as needed
      gradient: "from-indigo-600 to-purple-500",
      glow: "shadow-[0_0_15px_2px_rgba(129,140,248,0.6)]", // indigo glow
    },
  ];

  // Filter cards based on user role
  const allowedCards = cards.filter(card => card.allowed.includes(role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
            🧼 Cleaning Log
          </h1>
          <p className="text-gray-400 mt-2">
            Record and track cleaning activities for equipment.
          </p>
        </div>

        {allowedCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {allowedCards.map((card, index) => (
              <Link
                key={index}
                to={card.link}
                className="block transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl"
              >
                <Card className={`bg-gray-800/50 border-gray-700 hover:border-sky-500 transition-all ${card.glow}`}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{card.title}</h3>
                      <p className="text-gray-400 text-sm">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">You do not have access to any cleaning sections.</p>
          </div>
        )}

        {/* Outlet for nested routes like /cleaning/form or /cleaning/history */}
        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
