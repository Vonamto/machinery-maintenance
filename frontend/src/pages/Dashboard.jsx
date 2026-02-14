// frontend/src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Droplets, Truck, Users, CheckCircle, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

// 🔐 Centralized roles & permissions
import { PAGE_PERMISSIONS } from "@/config/roles";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "Guest";
  const { t } = useTranslation();

  const cards = [
    {
      title: t("dashboard.maintenanceLog.title"),
      description: t("dashboard.maintenanceLog.description"),
      icon: <Wrench className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/maintenance",
      allowed: PAGE_PERMISSIONS.MAINTENANCE,
      glow: "shadow-[0_0_15px_2px_rgba(59,130,246,0.6)]",
      gradient: "from-blue-600 to-cyan-500",
    },

    {
      title: t("dashboard.cleaningLog.title"),
      description: t("dashboard.cleaningLog.description"),
      icon: <Droplets className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/cleaning",
      allowed: PAGE_PERMISSIONS.CLEANING,
      glow: "shadow-[0_0_15px_2px_rgba(56,189,248,0.6)]",
      gradient: "from-sky-600 to-indigo-500",
    },

    {
      title: t("dashboard.checklist.title"),
      description: t("dashboard.checklist.description"),
      icon: <CheckCircle className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/checklist",
      allowed: PAGE_PERMISSIONS.CHECKLIST,
      glow: "shadow-[0_0_15px_2px_rgba(16,185,129,0.6)]",
      gradient: "from-emerald-600 to-teal-500",
    },

    {
      title: t("dashboard.equipmentList.title"),
      description: t("dashboard.equipmentList.description"),
      icon: <Truck className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/equipment",
      allowed: PAGE_PERMISSIONS.EQUIPMENT,
      glow: "shadow-[0_0_15px_2px_rgba(251,146,60,0.6)]",
      gradient: "from-orange-600 to-yellow-500",
    },

    {
      title: t("dashboard.suivi.title"),
      description: t("dashboard.suivi.description"),
      icon: <FileText className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/suivi",
      allowed: PAGE_PERMISSIONS.SUIVILIST,
      glow: "shadow-[0_0_15px_2px_rgba(236,72,153,0.6)]",
      gradient: "from-pink-600 to-rose-500",
    },

    {
      title: t("dashboard.users.title"),
      description: t("dashboard.users.description"),
      icon: <Users className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/users",
      allowed: PAGE_PERMISSIONS.USERS,
      glow: "shadow-[0_0_15px_2px_rgba(168,85,247,0.6)]",
      gradient: "from-purple-600 to-pink-500",
    },
  ];

  const visibleCards = cards.filter((card) =>
    card.allowed.includes(role)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />

      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          {t("dashboard.title")}
        </h1>

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
