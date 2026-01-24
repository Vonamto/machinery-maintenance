// frontend/src/pages/Checklist/index.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ChecklistMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/")}
        className="mb-4 text-sm text-theme-text-secondary hover:underline"
      >
        ← {t("common.back")}
      </button>

      <h1 className="text-2xl font-bold mb-2">
        {t("checklist.menu.title")}
      </h1>

      <p className="text-theme-text-secondary mb-6">
        {t("checklist.menu.subtitle")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submit Checklist */}
        <div
          onClick={() => navigate("/checklist/form")}
          className="cursor-pointer rounded-xl border border-theme-border bg-theme-background-secondary p-6 hover:shadow-lg transition"
        >
          <h2 className="text-lg font-semibold mb-2">
            {t("checklist.menu.cards.submit.title")}
          </h2>
          <p className="text-theme-text-secondary">
            {t("checklist.menu.cards.submit.description")}
          </p>
        </div>

        {/* Checklist History */}
        <div
          onClick={() => navigate("/checklist/history")}
          className="cursor-pointer rounded-xl border border-theme-border bg-theme-background-secondary p-6 hover:shadow-lg transition"
        >
          <h2 className="text-lg font-semibold mb-2">
            {t("checklist.menu.cards.history.title")}
          </h2>
          <p className="text-theme-text-secondary">
            {t("checklist.menu.cards.history.description")}
          </p>
        </div>
      </div>
    </div>
  );
}
