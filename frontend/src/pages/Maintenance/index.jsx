// frontend/src/pages/Maintenance/index.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardPlus, History, ArrowLeft, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Maintenance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const role = user?.role;

  const cards = [
    {
      title: t("maintenance.addLog.title"),
      description: t("maintenance.addLog.description"),
      icon: <ClipboardPlus className="w-10 h-10 text-white drop-shadow-lg" />,
      link: "/maintenance/form",
      gradient: "from-blue-600 to-cyan-500",
      glow: "shadow-[0_0_20px_3px_rgba(59,130,246,0.5)]",
      allowedRoles: ["Supervisor", "Mechanic"], // 🚫 Driver hidden
    },
    {
      title: t("maintenance.history.title"),
      description: t("maintenance.history.subtitle"),
      icon: <History className="w-10 h-10 text-white drop-shadow-lg" />,
      link: "/maintenance/history",
      gradient: "from-emerald-600 to-green-500",
      glow: "shadow-[0_0_20px_3px_rgba(34,197,94,0.5)]",
      allowedRoles: ["Supervisor", "Mechanic", "Driver"], // ✅ Driver allowed
    },
  ];

  const visibleCards = cards.filter((card) =>
    card.allowedRoles.includes(role)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          {t("common.back")}
        </button>

        <div className="mb-10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/40">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {t("maintenance.title")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {t("maintenance.description")}
            </p>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {visibleCards.map((card) => (
            <Link to={card.link} key={card.link}>
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
