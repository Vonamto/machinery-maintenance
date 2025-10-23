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
      icon: <Wrench className="w-8 h-8 text-blue-400" />,
      link: "/maintenance",
      allowed: ["Supervisor", "Mechanic", "Driver"],
      gradient: "from-blue-500/80 to-cyan-400/60",
    },
    {
      title: "Maintenance Requests",
      description: "Manage Spare Parts and Oil/Grease requests",
      icon: <ClipboardList className="w-8 h-8 text-green-400" />,
      link: "/requests",
      allowed: ["Supervisor", "Mechanic", "Driver"],
      gradient: "from-green-500/80 to-emerald-400/60",
    },
    {
      title: "Cleaning Log",
      description: "Record and view cleaning activities",
      icon: <Droplets className="w-8 h-8 text-sky-400" />,
      link: "/cleaning",
      allowed: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
      gradient: "from-sky-500/80 to-indigo-400/60",
    },
    {
      title: "Equipment List",
      description: "View and manage all vehicles/equipment",
      icon: <Truck className="w-8 h-8 text-orange-400" />,
      link: "/equipment",
      allowed: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
      gradient: "from-orange-500/80 to-yellow-400/60",
    },
    {
      title: "Users",
      description: "Manage user accounts and roles",
      icon: <Users className="w-8 h-8 text-purple-400" />,
      link: "/users",
      allowed: ["Supervisor"],
      gradient: "from-purple-500/80 to-pink-400/60",
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
              <Card className={`bg-gradient-to-br ${card.gradient} rounded-2xl shadow-lg hover:scale-[1.03] transition-all duration-300`}>
                <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3 backdrop-blur-md bg-white/10">
                  <div className="p-3 rounded-full bg-white/20">
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-white drop-shadow">
                    {card.title}
                  </h2>
                  <p className="text-gray-200 text-sm">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
