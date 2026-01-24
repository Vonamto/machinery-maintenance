// frontend/src/pages/Checklist/index.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, History } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ChecklistMenu() {
  const { user } = useAuth();
  const role = user?.role || "Guest";
  const { t } = useTranslation();

  const cards = [
    {
      title: t("checklist.menu.formTitle"),
      description: t("checklist.menu.formDescription"),
      icon: <FileText className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/checklist/form",
      allowed: ["Supervisor", "Mechanic", "Driver"],
      glow: "shadow-[0_0_15px_2px_rgba(16,185,129,0.6)]",
      gradient: "from-emerald-600 to-teal-500",
    },
    {
      title: t("checklist.menu.historyTitle"),
      description: t("checklist.menu.historyDescription"),
      icon: <History className="w-8 h-8 text-white drop-shadow-md" />,
      link: "/checklist/history",
      allowed: ["Supervisor", "Mechanic", "Driver"],
      glow: "shadow-[0_0_15px_2px_rgba(147,51,234,0.6)]",
      gradient: "from-purple-600 to-indigo-500",
    }
  ];

  const visibleCards = cards.filter((card) =>
    card.allowed.includes(role)
  );

  // Redirect if user doesn't have permission
  if (visibleCards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">
            {t("common.accessDenied")}
          </h1>
          <p className="text-gray-400">
            {t("common.noPermission")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />
      
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
          {t("checklist.menu.title")}
        </h1>

        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 max-w-4xl mx-auto">
          {visibleCards.map((card) => (
            <Link to={card.link} key={card.link}>
              <Card
                className={`rounded-2xl bg-gradient-to-br ${card.gradient} ${card.glow} hover:scale-[1.04] hover:brightness-110 transition-all duration-300 border border-white/10`}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3 min-h-[200px]">
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
