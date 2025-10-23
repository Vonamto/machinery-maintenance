// frontend/src/pages/Maintenance/index.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardPlus, History } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function Maintenance() {
  const { user } = useAuth();

  const cards = [
    {
      title: "Add Maintenance Log",
      description: "Fill a new maintenance record",
      icon: <ClipboardPlus className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/maintenance/form",
      gradient: "from-blue-600 to-cyan-500",
      glow: "shadow-[0_0_15px_2px_rgba(59,130,246,0.6)]",
    },
    {
      title: "Maintenance History",
      description: "View past maintenance operations",
      icon: <History className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/maintenance/history",
      gradient: "from-emerald-600 to-green-500",
      glow: "shadow-[0_0_15px_2px_rgba(34,197,94,0.6)]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Maintenance
        </h1>

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
