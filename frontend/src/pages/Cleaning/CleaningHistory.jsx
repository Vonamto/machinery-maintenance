// frontend/src/pages/Cleaning/CleaningHistory.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  ExternalLink,
  History as HistoryIcon,
  Droplets,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
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

export default function CleaningHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const [filters, setFilters] = useState({
    model: "",
    plate: "",
    driver: "",
    cleanedBy: "",
    cleaningType: "",
    from: "",
    to: "",
  });

  /* ---------------- Load Cleaning Log ---------------- */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Cleaning_Log`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setRows(data.reverse());
      } catch (err) {
        console.error("Error loading cleaning history:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  const cleanedByOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r["Cleaned By"]).filter(Boolean))
      ).sort(),
    [rows]
  );

  const cleaningTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r["Cleaning Type"]).filter(Boolean))
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
      const cleanedBy = r["Cleaned By"] || "";
      const cleaningType = r["Cleaning Type"] || "";

      const matchModel = !filters.model || model === filters.model;
      const matchPlate = !filters.plate || plate === filters.plate;
      const matchDriver = !filters.driver || driver === filters.driver;
      const matchCleanedBy =
        !filters.cleanedBy || cleanedBy === filters.cleanedBy;
      const matchCleaningType =
        !filters.cleaningType || cleaningType === filters.cleaningType;

      let matchDate = true;
      if (filters.from && date < filters.from) matchDate = false;
      if (filters.to && date > filters.to) matchDate = false;

      return (
        matchModel &&
        matchPlate &&
        matchDriver &&
        matchCleanedBy &&
        matchCleaningType &&
        matchDate
      );
    });
  }, [rows, filters]);

  const resetFilters = () =>
    setFilters({
      model: "",
      plate: "",
      driver: "",
      cleanedBy: "",
      cleaningType: "",
      from: "",
      to: "",
    });

  /* ---------------- Loading ---------------- */

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4" />
          <p className="text-lg">{t("cleaning.history.loading")}</p>
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
          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-500 shadow-lg shadow-sky-500/40">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
              {t("cleaning.history.title")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {t("cleaning.history.subtitle")}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 mb-8 shadow-lg">
          <div className="grid md:grid-cols-7 sm:grid-cols-2 gap-4">
            <select
              value={filters.model}
              onChange={(e) =>
                setFilters((f) => ({ ...f, model: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            >
              <option value="">{t("cleaning.history.filters.model")}</option>
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
              <option value="">{t("cleaning.history.filters.plate")}</option>
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
              <option value="">{t("cleaning.history.filters.driver")}</option>
              {driverOptions.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            <select
              value={filters.cleanedBy}
              onChange={(e) =>
                setFilters((f) => ({ ...f, cleanedBy: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            >
              <option value="">
                {t("cleaning.history.filters.cleanedBy")}
              </option>
              {cleanedByOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              value={filters.cleaningType}
              onChange={(e) =>
                setFilters((f) => ({ ...f, cleaningType: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            >
              <option value="">
                {t("cleaning.history.filters.cleaningType")}
              </option>
              {cleaningTypeOptions.map((c) => (
                <option key={c}>{c}</option>
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
              {t("cleaning.history.filters.reset")}
            </button>
          </div>
        </div>

        {/* Empty */}
        {filteredRows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <HistoryIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {t("cleaning.history.noResults")}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredRows.map((r, i) => (
                <div
                  key={i}
                  onClick={() =>
                    setExpandedIndex(expandedIndex === i ? null : i)
                  }
                  className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 shadow-lg cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-lg font-semibold text-sky-400">
                        {r["Plate Number"]}
                      </p>
                      <p className="text-sm text-gray-400">
                        {r["Model / Type"]}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-300">
                      {r["Date"]}
                    </span>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-gray-400">
                        {t("cleaning.history.table.cleanedBy")}:
                      </span>{" "}
                      {r["Cleaned By"]}
                    </p>
                    <p>
                      <span className="text-gray-400">
                        {t("cleaning.history.table.cleaningType")}:
                      </span>{" "}
                      {t(`cleaningTypes.${r["Cleaning Type"]}`) ||
                        r["Cleaning Type"]}
                    </p>
                    <p>
                      <span className="text-gray-400">
                        {t("cleaning.history.table.driver")}:
                      </span>{" "}
                      {r["Driver"]}
                    </p>
                  </div>

                  {expandedIndex === i && (
                    <>
                      <div className="mt-3 text-sm">
                        <span className="text-gray-400">
                          {t("cleaning.history.table.comments")}:
                        </span>{" "}
                        {r["Comments"] || "---"}
                      </div>

                      <div className="flex gap-3 mt-3">
                        {[
                          {
                            field: "Photo Before",
                            label: t(
                              "cleaning.history.table.photoBefore"
                            ),
                          },
                          {
                            field: "Photo After",
                            label: t(
                              "cleaning.history.table.photoAfter"
                            ),
                          },
                        ].map(
                          ({ field, label }) =>
                            r[field] ? (
                              <div
                                key={field}
                                className="flex flex-col items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <a
                                  href={r[field]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative group"
                                >
                                  <img
                                    src={getThumbnailUrl(r[field])}
                                    alt={label}
                                    className="h-16 w-16 object-cover rounded-lg border border-gray-600"
                                  />
                                  <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                                    <ExternalLink className="w-5 h-5 text-sky-400" />
                                  </div>
                                </a>
                                <span className="text-[11px] text-gray-400 text-center">
                                  {label}
                                </span>
                              </div>
                            ) : null
                        )}
                      </div>
                    </>
                  )}
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
                      "cleanedBy",
                      "cleaningType",
                      "comments",
                      "photoBefore",
                      "photoAfter",
                    ].map((h) => (
                      <th
                        key={h}
                        className="p-4 text-left text-sm font-semibold text-gray-300"
                      >
                        {t(`cleaning.history.table.${h}`)}
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
                      <td className="p-4 text-sm">{r["Cleaned By"]}</td>
                      <td className="p-4 text-sm">
                        {t(`cleaningTypes.${r["Cleaning Type"]}`) ||
                          r["Cleaning Type"]}
                      </td>
                      <td className="p-4 text-sm max-w-xs truncate">
                        {r["Comments"] || "---"}
                      </td>

                      {["Photo Before", "Photo After"].map((field) => (
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
                                className="h-16 w-16 object-cover rounded-lg border border-gray-600 group-hover:border-sky-500 group-hover:scale-110 transition-all duration-200 shadow-lg"
                              />
                              <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                                <ExternalLink className="w-6 h-6 text-sky-400" />
                              </div>
                            </a>
                          ) : (
                            <span className="text-gray-500 text-sm">---</span>
                          )}
                        </td>
                      ))}
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
