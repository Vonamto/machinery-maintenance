// frontend/src/pages/Maintenance/History.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  History as HistoryIcon,
  Wrench,
  ExternalLink,
  XCircle,
} from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    model: "",
    plate: "",
    driver: "",
    performedBy: "",
    from: "",
    to: "",
  });

  /* ---------------- Load Maintenance Log ---------------- */

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Maintenance_Log`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setRows(data.reverse());
      } catch (err) {
        console.error("Error loading maintenance history:", err);
      }
    }
    load();
  }, []);

  /* ---------------- Ensure Equipment Cache ---------------- */

  useEffect(() => {
    const ensureEquipmentLoaded = async () => {
      const hasEquipment =
        cache.getEquipment && cache.getEquipment().length > 0;
      if (!hasEquipment) {
        await cache.forceRefreshEquipment?.();
      }
      setLoading(false);
    };
    ensureEquipmentLoaded();
  }, [cache]);

  /* ---------------- Driver → Allowed Plates ---------------- */

  const driverAllowedPlates = useMemo(() => {
    if (user?.role !== "Driver") return null;
    const equipment = cache.getEquipment?.() || [];
    if (!equipment.length) return null;

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

  const performedByOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r["Performed By"]).filter(Boolean))
      ).sort(),
    [rows]
  );

  /* ---------------- Apply filters ---------------- */

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const date = r["Date"];
      const model = r["Model / Type"] || "";
      const plate = r["Plate Number"] || "";
      const driver = r["Driver"] || "";
      const performedBy = r["Performed By"] || "";

      if (
        user?.role === "Driver" &&
        Array.isArray(driverAllowedPlates) &&
        !driverAllowedPlates.includes(plate)
      ) {
        return false;
      }

      const matchModel = !filters.model || model === filters.model;
      const matchPlate = !filters.plate || plate === filters.plate;
      const matchDriver = !filters.driver || driver === filters.driver;
      const matchPerformedBy =
        !filters.performedBy || performedBy === filters.performedBy;

      let matchDate = true;
      if (filters.from && date < filters.from) matchDate = false;
      if (filters.to && date > filters.to) matchDate = false;

      return (
        matchModel &&
        matchPlate &&
        matchDriver &&
        matchPerformedBy &&
        matchDate
      );
    });
  }, [rows, filters, user, driverAllowedPlates]);

  const resetFilters = () =>
    setFilters({
      model: "",
      plate: "",
      driver: "",
      performedBy: "",
      from: "",
      to: "",
    });

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
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          {t("common.back")}
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 shadow-lg shadow-emerald-500/40">
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

        {/* Filters */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 mb-8 shadow-lg">
          <div className="grid md:grid-cols-6 sm:grid-cols-2 gap-4">
            <select
              value={filters.model}
              onChange={(e) =>
                setFilters((f) => ({ ...f, model: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            >
              <option value="">{t("maintenance.history.filters.model")}</option>
              {modelOptions.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            <select
              value={filters.plate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, plate: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            >
              <option value="">{t("maintenance.history.filters.plate")}</option>
              {plateOptions.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>

            <select
              value={filters.driver}
              onChange={(e) =>
                setFilters((f) => ({ ...f, driver: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            >
              <option value="">{t("maintenance.history.filters.driver")}</option>
              {driverOptions.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            <select
              value={filters.performedBy}
              onChange={(e) =>
                setFilters((f) => ({ ...f, performedBy: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            >
              <option value="">
                {t("maintenance.history.filters.performedBy")}
              </option>
              {performedByOptions.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters((f) => ({ ...f, from: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            />

            <input
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((f) => ({ ...f, to: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            />
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium"
            >
              <XCircle size={14} />
              {t("maintenance.history.filters.reset")}
            </button>
          </div>
        </div>

        {/* Empty */}
        {filteredRows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <HistoryIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {t("maintenance.history.noResults")}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredRows.map((r, i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-lg font-semibold text-emerald-400">
                        {r["Plate Number"]}
                      </p>
                      <p className="text-sm text-gray-400">
                        {r["Model / Type"]}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {r["Date"]}
                    </span>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-gray-400">
                        {t("maintenance.history.table.description")}:
                      </span>{" "}
                      {translateDescription(r["Description of Work"])}
                    </p>
                    <p>
                      <span className="text-gray-400">
                        {t("maintenance.history.table.performedBy")}:
                      </span>{" "}
                      {r["Performed By"]}
                    </p>
                    <p>
                      <span className="text-gray-400">
                        {t("maintenance.history.table.driver")}:
                      </span>{" "}
                      {r["Driver"]}
                    </p>
                    <p>
                      <span className="text-gray-400">
                        {t("maintenance.history.table.completionDate")}:
                      </span>{" "}
                      {r["Completion Date"] || "---"}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {["Photo Before", "Photo After", "Photo Repair/Problem"].map(
                      (field) =>
                        r[field] ? (
                          <a
                            key={field}
                            href={r[field]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group"
                          >
                            <img
                              src={getThumbnailUrl(r[field])}
                              alt={field}
                              className="h-16 w-16 object-cover rounded-lg border border-gray-600"
                            />
                            <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                              <ExternalLink className="w-5 h-5 text-emerald-400" />
                            </div>
                          </a>
                        ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-700 shadow-2xl">
              <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
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
                      <th
                        key={h}
                        className="p-4 text-left text-sm font-semibold text-gray-300"
                      >
                        {t(`maintenance.history.table.${h}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-t border-gray-700 hover:bg-white/5 transition-colors ${
                        i % 2 === 0 ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      <td className="p-4 text-sm text-gray-400">{i + 1}</td>
                      <td className="p-4 text-sm">{r["Date"]}</td>
                      <td className="p-4 text-sm">{r["Model / Type"]}</td>
                      <td className="p-4 text-sm font-mono">
                        {r["Plate Number"]}
                      </td>
                      <td className="p-4 text-sm">{r["Driver"]}</td>
                      <td className="p-4 text-sm">{r["Performed By"]}</td>
                      <td className="p-4 text-sm">
                        {translateDescription(r["Description of Work"])}
                      </td>
                      <td className="p-4 text-sm">
                        {r["Completion Date"] || "---"}
                      </td>
                      <td className="p-4 text-sm max-w-xs truncate">
                        {r["Comments"] || "---"}
                      </td>

                      {["Photo Before", "Photo After", "Photo Repair/Problem"].map(
                        (field) => (
                          <td key={field} className="p-4">
                            {r[field] ? (
                              <a
                                href={r[field]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group block"
                              >
                                <img
                                  src={getThumbnailUrl(r[field])}
                                  alt={field}
                                  className="h-16 w-16 object-cover rounded-lg border border-gray-600 group-hover:border-emerald-500 group-hover:scale-110 transition-all duration-200 shadow-lg"
                                />
                                <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                                  <ExternalLink className="w-6 h-6 text-emerald-400" />
                                </div>
                              </a>
                            ) : (
                              <span className="text-gray-500 text-sm">---</span>
                            )}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
