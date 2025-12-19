// frontend/src/pages/Requests/GreaseOil/index.jsx
import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Droplets,
  Clock,
  History,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function GreaseOilMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Role-based access control
  if (user && !["Supervisor", "Mechanic", "Driver"].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">
            {t("requests.grease.menu.accessDenied.title")}
          </h1>
          <p className="text-gray-300">
            {t("requests.grease.menu.accessDenied.message")}
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: t("requests.grease.menu.cards.make.title"),
      description: t("requests.grease.menu.cards.make.description"),
      icon: <Droplets className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/requests/grease-oil/form",
      gradient: "from-blue-600 to-cyan-500",
      glow: "shadow-[0_0_15px_2px_rgba(59,130,246,0.6)]",
    },
    {
      title: t("requests.grease.menu.cards.current.title"),
      description: t("requests.grease.menu.cards.current.description"),
      icon: <Clock className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/requests/grease-oil/current",
      gradient: "from-amber-600 to-orange-500",
      glow: "shadow-[0_0_15px_2px_rgba(251,146,60,0.6)]",
    },
    {
      title: t("requests.grease.menu.cards.history.title"),
      description: t("requests.grease.menu.cards.history.description"),
      icon: <History className="w-10 h-10 text-white drop-shadow-md" />,
      link: "/requests/grease-oil/history",
      gradient: "from-emerald-600 to-green-500",
      glow: "shadow-[0_0_15px_2px_rgba(34,197,94,0.6)]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft size={18} />
          {t("requests.grease.menu.back")}
        </button>

        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
          {t("requests.grease.menu.title")}
        </h1>

        {/* Cards */}
        <div className="grid gap-8 sm:grid-cols-3">
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
                  <p className="text-gray-100/90 text-sm">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Nested routes */}
        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
