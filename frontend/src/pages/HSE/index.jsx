// frontend/src/pages/HSE/index.jsx

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Package, HandHelping, History, HardHat } from "lucide-react";

// 🔐 Centralized permissions
import { PAGE_PERMISSIONS } from "@/config/roles";

export default function HSEIndex() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const role = user?.role || "Guest";

  const cards = [
    {
      title: t("hse.menu.cards.stock.title"),
      description: t("hse.menu.cards.stock.description"),
      icon: <Package className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/hse/stock",
      allowed: PAGE_PERMISSIONS.HSE_STOCK,
      gradient: "from-yellow-600 to-amber-500",
      glow: "shadow-[0_0_15px_2px_rgba(234,179,8,0.5)]",
    },
    {
      title: t("hse.menu.cards.distribute.title"),
      description: t("hse.menu.cards.distribute.description"),
      icon: <HandHelping className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/hse/distribute",
      allowed: PAGE_PERMISSIONS.HSE_DISTRIBUTE,
      gradient: "from-orange-600 to-red-500",
      glow: "shadow-[0_0_15px_2px_rgba(234,88,12,0.5)]",
    },
    {
      title: t("hse.menu.cards.history.title"),
      description: t("hse.menu.cards.history.description"),
      icon: <History className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/hse/history",
      allowed: PAGE_PERMISSIONS.HSE_HISTORY,
      gradient: "from-lime-600 to-green-500",
      glow: "shadow-[0_0_15px_2px_rgba(101,163,13,0.5)]",
    },
    {
      title: t("hse.menu.cards.workers.title"),
      description: t("hse.menu.cards.workers.description"),
      icon: <HardHat className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/hse/workers",
      allowed: PAGE_PERMISSIONS.HSE_WORKERS,
      gradient: "from-cyan-600 to-teal-500",
      glow: "shadow-[0_0_15px_2px_rgba(8,145,178,0.5)]",
    },
  ];

  // Only show cards the current role has access to
  const visibleCards = cards.filter((card) => card.allowed.includes(role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />

      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block"
          >
            ← {t("common.back")}
          </Link>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            {t("hse.menu.title")}
          </h1>
          <p className="text-gray-400 mt-1">{t("hse.menu.subtitle")}</p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
