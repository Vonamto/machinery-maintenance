// frontend/src/pages/Checklist/index.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { Card, CardContent } from "../../components/ui/card";
import { ClipboardCheck, History, ArrowLeft, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
// Centralized permissions
import { PAGE_PERMISSIONS } from "../../config/roles";

export default function ChecklistMenu() {
  const { user } = useAuth();
  const role = user?.role || "Guest";
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cards = [
    {
      title: t("checklist.menu.formTitle"),
      description: t("checklist.menu.formDescription"),
      icon: <ClipboardCheck className="w-10 h-10 text-white drop-shadow-lg" />,
      link: "/checklist/form",
      gradient: "from-emerald-600 to-teal-500",
      glow: "shadow-[0_20px_3px_rgba(16,185,129,0.5)]",
      allowedRoles: PAGE_PERMISSIONS.CHECKLIST_FORM,
    },
    {
      title: t("checklist.menu.historyTitle"),
      description: t("checklist.menu.historyDescription"),
      icon: <History className="w-10 h-10 text-white drop-shadow-lg" />,
      link: "/checklist/history",
      gradient: "from-purple-600 to-indigo-500",
      glow: "shadow-[0_20px_3px_rgba(147,51,234,0.5)]",
      allowedRoles: PAGE_PERMISSIONS.CHECKLIST_HISTORY,
    },
  ];

  const visibleCards = cards.filter((card) =>
    card.allowedRoles.includes(role)
  );

  // Redirect message if user doesn't have permission
  if (visibleCards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">
            {t("common.accessDenied")}
          </h1>
          <p className="text-gray-400">{t("common.noPermission")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-5xl mx-auto p-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          {t("common.back")}
        </button>

        {/* Header with Icon, Title, and Subtitle */}
        <div className="mb-10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/40">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
              {t("checklist.menu.title")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {t("checklist.menu.subtitle")}
            </p>
          </div>
        </div>

        {/* Cards Grid */}
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
