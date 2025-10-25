// frontend/src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, ClipboardList, Droplets, Truck, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "Guest";

  const cards = [
    {
      title: "Maintenance Log",
      description: "Fill or view maintenance operations",
      icon: <Wrench className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/maintenance",
      allowed: ["Supervisor", "Mechanic", "Driver"],
      glow: "shadow-[0_0_15px_2px_rgba(59,130,246,0.6)]", // blue glow
      gradient: "from-blue-600 to-cyan-500",
    },
    {
      title: "Maintenance Requests",
      description: "Manage Spare Parts and Oil/Grease requests",
      icon: <ClipboardList className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/requests",
      allowed: ["Supervisor", "Mechanic", "Driver"],
      glow: "shadow-[0_0_15px_2px_rgba(34,197,94,0.6)]", // green glow
      gradient: "from-emerald-600 to-green-500",
    },
    {
      title: "Cleaning Log",
      description: "Record and view cleaning activities",
      icon: <Droplets className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/cleaning",
      allowed: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
      glow: "shadow-[0_0_15px_2px_rgba(56,189,248,0.6)]", // sky glow
      gradient: "from-sky-600 to-indigo-500",
    },
    {
      title: "Equipment List",
      description: "View and manage all vehicles/equipment",
      icon: <Truck className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/equipment",
      allowed: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
      glow: "shadow-[0_0_15px_2px_rgba(251,146,60,0.6)]", // orange glow
      gradient: "from-orange-600 to-yellow-500",
    },
    {
      title: "Users",
      description: "Manage user accounts and roles",
      icon: <Users className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/users",
      allowed: ["Supervisor"],
      glow: "shadow-[0_0_15px_2px_rgba(168,85,247,0.6)]", // purple glow
      gradient: "from-purple-600 to-pink-500",
    },
  ];

  const visibleCards = cards.filter((card) => card.allowed.includes(role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* ✅ Navbar */}
      <Navbar user={user} />

      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Dashboard
        </h1>

        {/* ✅ Cards grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCards.map((card) => (
            <Link to={card.link} key={card.title}>
              <Card
                className={`rounded-2xl bg-gradient-to-br ${card.gradient} ${card.glow} hover:scale-[1.04] hover:brightness-110 transition-all duration-300 border border-white/10`}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-white drop-shadow-md">
                    {card.title}
                  </h2>
                  <p className="text-gray-100/90 text-sm">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
