// frontend/src/pages/Cleaning/CleaningHistory.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Droplets,
  XCircle,
  X as XIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";
import { fetchWithAuth } from "@/api/api";
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
  const cache = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);

  const [filters, setFilters] = useState({
    model: "",
    plate: "",
    driver: "",
    cleanedBy: "",
    cleaningType: "",
    from: "",
    to: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        if (Array.isArray(data)) {
          const reversed = data.reverse();
          const withIndex = reversed.map((row, i) => ({
            ...row,
            __row_index: data.length + 1 - i,
          }));
          setRows(withIndex);
        }
      } catch (err) {
        console.error("Error loading cleaning history:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------------- Driver → Allowed Plates ---------------- */

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

  /* ---------------- Filter Options ---------------- */

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

  /* ---------------- Apply Filters ---------------- */

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const date = r["Date"];
      const model = r["Model / Type"] || "";
      const plate = r["Plate Number"] || "";
      const driver = r["Driver"] || "";
      const cleanedBy = r["Cleaned By"] || "";
      const cleaningType = r["Cleaning Type"] || "";

      if (
        user?.role === "Driver" &&
        Array.isArray(driverAllowedPlates) &&
        !driverAllowedPlates.includes(plate)
      ) {
        return false;
      }

      if (filters.model && model !== filters.model) return false;
      if (filters.plate && plate !== filters.plate) return false;
      if (filters.driver && driver !== filters.driver) return false;
      if (filters.cleanedBy && cleanedBy !== filters.cleanedBy) return false;
      if (filters.cleaningType && cleaningType !== filters.cleaningType)
        return false;

      if (filters.from && date < filters.from) return false;
      if (filters.to && date > filters.to) return false;

      return true;
    });
  }, [rows, filters, user, driverAllowedPlates]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = filteredRows.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const resetFilters = () => {
    setFilters({
      model: "",
      plate: "",
      driver: "",
      cleanedBy: "",
      cleaningType: "",
      from: "",
      to: "",
    });
    setCurrentPage(1);
  };

  /* ---------------- Delete ---------------- */

  const handleDelete = async (rowIndexInPage) => {
    const actualIndex = startIndex + rowIndexInPage;
    const rowToDelete = filteredRows[actualIndex];

    const confirmDelete = window.confirm(
      t("maintenance.history.deleteConfirm")
    );
    if (!confirmDelete) return;

    if (!rowToDelete?.__row_index) {
      alert(t("maintenance.history.deleteError"));
      return;
    }

    try {
      const res = await fetchWithAuth(
        `/api/delete/Cleaning_Log/${rowToDelete.__row_index}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      if (result.status === "success") {
        setRows((prev) =>
          prev.filter((r) => r.__row_index !== rowToDelete.__row_index)
        );
        alert(t("maintenance.history.deleteSuccess"));
      } else {
        alert(t("maintenance.history.deleteError"));
      }
    } catch {
      alert(t("maintenance.history.deleteError"));
    }
  };

  /* ---------------- Loading ---------------- */

  if (loading) {
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
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-500">
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
        <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-4 mb-8">
          <div className="grid md:grid-cols-7 sm:grid-cols-2 gap-4">
            <select value={filters.model} onChange={(e) => setFilters(f => ({ ...f, model: e.target.value }))} className="p-2 rounded-lg bg-gray-900 border border-gray-700">
              <option value="">{t("cleaning.history.filters.model")}</option>
              {modelOptions.map(m => <option key={m}>{m}</option>)}
            </select>

            <select value={filters.plate} onChange={(e) => setFilters(f => ({ ...f, plate: e.target.value }))} className="p-2 rounded-lg bg-gray-900 border border-gray-700">
              <option value="">{t("cleaning.history.filters.plate")}</option>
              {plateOptions.map(p => <option key={p}>{p}</option>)}
            </select>

            <select value={filters.driver} onChange={(e) => setFilters(f => ({ ...f, driver: e.target.value }))} className="p-2 rounded-lg bg-gray-900 border border-gray-700">
              <option value="">{t("cleaning.history.filters.driver")}</option>
              {driverOptions.map(d => <option key={d}>{d}</option>)}
            </select>

            <select value={filters.cleanedBy} onChange={(e) => setFilters(f => ({ ...f, cleanedBy: e.target.value }))} className="p-2 rounded-lg bg-gray-900 border border-gray-700">
              <option value="">{t("cleaning.history.filters.cleanedBy")}</option>
              {cleanedByOptions.map(c => <option key={c}>{c}</option>)}
            </select>

            <select value={filters.cleaningType} onChange={(e) => setFilters(f => ({ ...f, cleaningType: e.target.value }))} className="p-2 rounded-lg bg-gray-900 border border-gray-700">
              <option value="">{t("cleaning.history.filters.cleaningType")}</option>
              {cleaningTypeOptions.map(c => <option key={c}>{c}</option>)}
            </select>

            <input type="date" value={filters.from} onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))} className="p-2 rounded-lg bg-gray-900 border border-gray-700" />
            <input type="date" value={filters.to} onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))} className="p-2 rounded-lg bg-gray-900 border border-gray-700" />
          </div>

          <div className="flex justify-between mt-4">
            {user?.role === "Supervisor" && (
              <button
                onClick={() => setDeleteMode(v => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  deleteMode ? "bg-red-600/20 text-red-400" : "bg-gray-700 text-gray-300"
                }`}
              >
                {deleteMode ? <XIcon size={14} /> : <Trash2 size={14} />}
                {deleteMode ? t("common.cancel") : t("equipment.manage.actions.delete")}
              </button>
            )}

            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm"
            >
              <XCircle size={14} />
              {t("cleaning.history.filters.reset")}
            </button>
          </div>
        </div>

        {/* Mobile Cards (Maintenance-style expandable) */}
        <div className="md:hidden space-y-4">
          {paginatedRows.map((r, i) => (
            <div
              key={r.__row_index}
              className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 shadow-lg"
            >
              <div
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="cursor-pointer"
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
                  <span className="text-xs text-gray-300">{r["Date"]}</span>
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
                    {t(`cleaningTypes.${r["Cleaning Type"]}`) || r["Cleaning Type"]}
                  </p>
                </div>

                {expandedIndex === i && (
                  <>
                    <div className="mt-3 text-sm">
                      <span className="text-gray-400">
                        {t("cleaning.history.table.driver")}:
                      </span>{" "}
                      {r["Driver"]}
                    </div>

                    <div className="mt-3 text-sm">
                      <span className="text-gray-400">
                        {t("cleaning.history.table.comments")}:
                      </span>{" "}
                      {r["Comments"] || "---"}
                    </div>

                    <div className="flex gap-3 mt-3">
                      {[
                        { field: "Photo Before", label: t("cleaning.history.table.photoBefore") },
                        { field: "Photo After", label: t("cleaning.history.table.photoAfter") },
                      ].map(
                        ({ field, label }) =>
                          r[field] && (
                            <div key={field} className="flex flex-col items-center gap-1">
                              <a
                                href={r[field]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <img
                                  src={getThumbnailUrl(r[field])}
                                  alt={label}
                                  className="h-16 w-16 rounded-lg border border-gray-600"
                                />
                                <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                                  <ExternalLink className="w-5 h-5 text-sky-400" />
                                </div>
                              </a>
                              <span className="text-[11px] text-gray-400 text-center">
                                {label}
                              </span>
                            </div>
                          )
                      )}
                    </div>

                    {deleteMode && (
                      <button
                        onClick={() => handleDelete(i)}
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                      >
                        <Trash2 size={14} />
                        {t("equipment.manage.actions.delete")}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (unchanged) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-700">
          <table className="min-w-full bg-gray-800/50">
            <thead className="bg-gray-900">
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
                  <th key={h} className="p-4 text-left text-sm text-gray-300">
                    {t(`cleaning.history.table.${h}`)}
                  </th>
                ))}
                {deleteMode && (
                  <th className="p-4 text-left text-sm text-red-400">
                    {t("equipment.manage.actions.delete")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r, i) => (
                <tr key={r.__row_index} className="border-t border-gray-700">
                  <td className="p-4 text-sm text-gray-400">{startIndex + i + 1}</td>
                  <td className="p-4 text-sm">{r["Date"]}</td>
                  <td className="p-4 text-sm">{r["Model / Type"]}</td>
                  <td className="p-4 text-sm font-mono">{r["Plate Number"]}</td>
                  <td className="p-4 text-sm">{r["Driver"]}</td>
                  <td className="p-4 text-sm">{r["Cleaned By"]}</td>
                  <td className="p-4 text-sm">
                    {t(`cleaningTypes.${r["Cleaning Type"]}`) || r["Cleaning Type"]}
                  </td>
                  <td className="p-4 text-sm truncate max-w-xs">{r["Comments"] || "---"}</td>

                  {["Photo Before", "Photo After"].map((field) => (
                    <td key={field} className="p-4">
                      {r[field] ? (
                        <a href={r[field]} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getThumbnailUrl(r[field])}
                            alt={field}
                            className="h-16 w-16 rounded-lg border border-gray-600"
                          />
                        </a>
                      ) : (
                        <span className="text-gray-500">---</span>
                      )}
                    </td>
                  ))}

                  {deleteMode && (
                    <td className="p-4">
                      <button
                        onClick={() => handleDelete(i)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                      >
                        <Trash2 size={14} />
                        {t("equipment.manage.actions.delete")}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === pageNum
                      ? "bg-sky-600 text-white"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
