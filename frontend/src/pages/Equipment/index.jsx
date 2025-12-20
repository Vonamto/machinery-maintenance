// frontend/src/pages/Equipment/index.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { List, Settings, ArrowLeft, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export default function EquipmentMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cards = [
    {
      title: t("equipment.menu.cards.list.title"),
      description: t("equipment.menu.cards.list.description"),
      icon: <List className="w-10 h-10 text-white drop-shadow-lg" />,
      link: "/equipment/list",
      gradient: "from-orange-600 to-yellow-500",
      glow: "shadow-[0_0_20px_3px_rgba(251,146,60,0.5)]",
      allowed: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
    },
    {
      title: t("equipment.menu.cards.manage.title"),
      description: t("equipment.menu.cards.manage.description"),
      icon: <Settings className="w-10 h-10 text-white drop-shadow-lg" />,
      link: "/equipment/manage",
      gradient: "from-red-600 to-orange-500",
      glow: "shadow-[0_0_20px_3px_rgba(239,68,68,0.5)]",
      allowed: ["Supervisor"],
    },
  ];

  const visibleCards = cards.filter((card) =>
    card.allowed.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto p-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          {t("equipment.menu.back")}
        </button>

        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-600 to-yellow-500 shadow-lg shadow-orange-500/40">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">
              {t("equipment.menu.title")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {t("equipment.menu.subtitle")}
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-8 sm:grid-cols-2">
          {visibleCards.map((card) => (
            <Link to={card.link} key={card.title}>
              <Card
                className={`rounded-2xl bg-gradient-to-br ${card.gradient} ${card.glow} hover:scale-[1.04] hover:brightness-110 transition-all duration-300 border border-white/10 backdrop-blur-md`}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-white drop-shadow-md">
                    {card.title}
                  </h2>
                  <p className="text-gray-100/90 text-sm max-w-[200px]">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
