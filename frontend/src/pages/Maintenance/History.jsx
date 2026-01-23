// frontend/src/pages/Maintenance/History.jsx
import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, History as HistoryIcon, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";
import { useTranslation } from "react-i18next";

/* ---------------- Helpers ---------------- */

const getThumbnailUrl = (url) => {
  if (!url) return null;
  const match = url.match(/id=([^&]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  }
  return url;
};

/* ---------------- Component ---------------- */

export default function MaintenanceHistory() {
  const { user } = useAuth();
  const cache = useCache();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    model: "",
    plate: "",
    driver: "",
    from: "",
    to: "",
  });

  /* ---------------- Load data ---------------- */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Maintenance_Log`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setRows(data.reverse());
      } catch (err) {
        console.error("Error loading maintenance history:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------------- Driver auto-filter ---------------- */

  const driverAllowedPlates = useMemo(() => {
    if (user?.role !== "Driver") return null;
    const equipment = cache.getEquipment?.() || [];
    return equipment
      .filter(
        (e) =>
          e["Driver"] === user.full_name ||
          e["Driver 1"] === user.full_name ||
          e["Driver 2"] === user.full_name
      )
      .map((e) => e["Plate Number"])
      .filter(Boolean);
  }, [user, cache]);

  /* ---------------- Filter options ---------------- */

  const modelOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r["Model / Type"]).filter(Boolean))
      ).sort(),
    [rows]
  );

  const plateOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r["Plate Number"]).filter(Boolean))
      ).sort(),
    [rows]
  );

  const driverOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r["Driver"]).filter(Boolean))).sort(),
    [rows]
  );

  /* ---------------- Filter rows ---------------- */

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const date = r["Date"];
      const model = r["Model / Type"] || "";
      const plate = r["Plate Number"] || "";
      const driver = r["Driver"] || "";

      if (
        user?.role === "Driver" &&
        driverAllowedPlates &&
        !driverAllowedPlates.includes(plate)
      ) {
        return false;
      }

      const matchModel = !filters.model || model === filters.model;
      const matchPlate = !filters.plate || plate === filters.plate;
      const matchDriver = !filters.driver || driver === filters.driver;

      let matchDate = true;
      if (filters.from && date < filters.from) matchDate = false;
      if (filters.to && date > filters.to) matchDate = false;

      return matchModel && matchPlate && matchDriver && matchDate;
    });
  }, [rows, filters, user, driverAllowedPlates]);

  /* ---------------- Description translation ---------------- */

  const translateDescription = (value) => {
    if (!value) return "---";

    const cleaningKey = `cleaningTypes.${value}`;
    const cleaningTranslated = t(cleaningKey);
    if (cleaningTranslated !== cleaningKey) return cleaningTranslated;

    const requestKey = `requestTypes.${value}`;
    const requestTranslated = t(requestKey);
    if (requestTranslated !== requestKey) return requestTranslated;

    return value;
  };

  /* ---------------- Loading ---------------- */

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4" />
          <p className="text-lg">{t("maintenance.history.loading")}</p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 shadow-lg">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              {t("maintenance.history.title")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {t("maintenance.history.subtitle")}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-700">
          <table className="min-w-full bg-gray-800/50">
            <thead>
              <tr>
                {[
                  "index",
                  "date",
                  "model",
                  "plate",
                  "driver",
                  "performedBy",
                  "description",
                  "completionDate",
                  "comments",
                  "photoBefore",
                  "photoAfter",
                  "photoProblem",
                ].map((h) => (
                  <th key={h} className="p-4 text-left text-sm text-gray-300">
                    {t(`maintenance.history.table.${h}`)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i} className="border-t border-gray-700">
                  <td className="p-4 text-sm text-gray-400">{i + 1}</td>
                  <td className="p-4 text-sm">{r["Date"]}</td>
                  <td className="p-4 text-sm">{r["Model / Type"]}</td>
                  <td className="p-4 text-sm">{r["Plate Number"]}</td>
                  <td className="p-4 text-sm">{r["Driver"]}</td>
                  <td className="p-4 text-sm">{r["Performed By"]}</td>
                  <td className="p-4 text-sm">
                    {translateDescription(r["Description of Work"])}
                  </td>
                  <td className="p-4 text-sm">
                    {r["Completion Date"] || "---"}
                  </td>
                  <td className="p-4 text-sm">
                    {r["Comments"] || "---"}
                  </td>

                  {["Photo Before", "Photo After", "Photo Repair/Problem"].map(
                    (field) => (
                      <td key={field} className="p-4">
                        {r[field] ? (
                          <a href={r[field]} target="_blank" rel="noreferrer">
                            <img
                              src={getThumbnailUrl(r[field])}
                              alt={field}
                              className="h-16 w-16 rounded-lg border border-gray-600 hover:scale-105 transition"
                            />
                          </a>
                        ) : (
                          <span className="text-gray-500">---</span>
                        )}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
