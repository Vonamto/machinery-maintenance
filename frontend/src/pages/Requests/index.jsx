// frontend/src/pages/Requests/index.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Droplet, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function RequestsMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const cards = [
    {
      title: "Spare Parts Requests",
      description: "Request parts, view status and history",
      icon: <Package className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/requests/parts",
      gradient: "from-blue-600 to-cyan-500",
      glow: "shadow-[0_0_15px_2px_rgba(59,130,246,0.6)]",
    },
    {
      title: "Grease/Oil Requests",
      description: "Request oil/grease service, schedule appointments",
      icon: <Droplet className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/requests/grease-oil",
      gradient: "from-amber-600 to-orange-500",
      glow: "shadow-[0_0_15px_2px_rgba(251,146,60,0.6)]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="p-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Page Header */}
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Maintenance Requests
        </h1>

        {/* Cards Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {cards.map((card) => (
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
