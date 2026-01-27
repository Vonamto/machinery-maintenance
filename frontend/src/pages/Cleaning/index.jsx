// frontend/src/pages/Cleaning/index.jsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardPlus, History, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

// 🔐 Centralized permissions
import { PAGE_PERMISSIONS } from "@/config/roles";

export default function CleaningMenu() {
  const { user } = useAuth();
  const role = user?.role;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cards = [
    {
      title: t("cleaning.menu.cards.addLog.title"),
      description: t("cleaning.menu.cards.addLog.description"),
      icon: <ClipboardPlus className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/cleaning/form",
      gradient: "from-sky-600 to-indigo-500",
      glow: "shadow-[0_0_15px_2px_rgba(56,189,248,0.6)]",
      allowedRoles: PAGE_PERMISSIONS.CLEANING_FORM,
    },
    {
      title: t("cleaning.menu.cards.history.title"),
      description: t("cleaning.menu.cards.history.description"),
      icon: <History className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/cleaning/history",
      gradient: "from-indigo-600 to-purple-500",
      glow: "shadow-[0_0_15px_2px_rgba(99,102,241,0.6)]",
      allowedRoles: PAGE_PERMISSIONS.CLEANING_HISTORY,
    },
  ];

  const visibleCards = cards.filter((card) =>
    card.allowedRoles.includes(role)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="p-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft size={18} /> {t("cleaning.menu.back")}
        </button>

        {/* Page Header */}
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
          {t("cleaning.menu.title")}
        </h1>

        {/* Cards Grid */}
        <div className="grid gap-8 sm:grid-cols-2">
          {visibleCards.map((card) => (
            <Link to={card.link} key={card.link}>
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
                  <p className="text-gray-100/90 text-sm">
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
