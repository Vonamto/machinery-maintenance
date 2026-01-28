// frontend/src/pages/Maintenance/History.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  History as HistoryIcon,
  Wrench,
  ExternalLink,
  XCircle,
  X as XIcon,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";
import { fetchWithAuth } from "@/api/api"; // Import the fetchWithAuth helper
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
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false); // State for delete mode

  const [filters, setFilters] = useState({
    model: "",
    plate: "",
    driver: "",
    performedBy: "",
    from: "",
    to: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items per page

  /* ---------------- Load Maintenance Log ---------------- */

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Maintenance_Log`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          // Add __row_index to each row for accurate deletion
          const dataWithIndex = data.map((row, index) => ({
            ...row,
            __row_index: index + 2, // Google Sheets starts counting rows from 1, header is row 1
          }));
          setRows(dataWithIndex);
        }
      } catch (err) {
        console.error("Error loading maintenance history:", err);
      } finally {
         setLoading(false); // Ensure loading is stopped even on error
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
      // setLoading(false); // Moved to the first useEffect to handle initial load correctly
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

  // Pagination logic
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

  const resetFilters = () =>
    setFilters({
      model: "",
      plate: "",
      driver: "",
      performedBy: "",
      from: "",
      to: "",
    });

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /* ---------------- Delete Entry ---------------- */
  const handleDelete = async (rowIndexInPaginatedList) => {
    const actualRowIndexInFiltered = startIndex + rowIndexInPaginatedList;
    const rowToDelete = filteredRows[actualRowIndexInFiltered]; // Get the correct row from the filtered list
    const confirmDelete = window.confirm(t("maintenance.history.deleteConfirm"));
    if (!confirmDelete) return;

    if (!rowToDelete || typeof rowToDelete.__row_index === 'undefined') {
       console.error("Cannot delete row: Missing __row_index.", rowToDelete);
       alert(t("maintenance.history.deleteError")); // Or a more specific error message
       return;
    }

    try {
      const response = await fetchWithAuth(`/api/delete/Maintenance_Log/${rowToDelete.__row_index}`, {
        method: "DELETE", // Use DELETE method
        headers: { "Content-Type": "application/json" }, // Include auth token via fetchWithAuth
      });

      const result = await response.json();
      if (result.status === "success") {
        // Optimistically update the state to remove the deleted item
        setRows(prevRows => prevRows.filter(r => r.__row_index !== rowToDelete.__row_index));
        // Show success message
        alert(t("maintenance.history.deleteSuccess")); // Add this translation key
      } else {
        console.error("Deletion failed:", result.message);
        alert(t("maintenance.history.deleteError")); // Add this translation key
      }
    } catch (error) {
      console.error("Error deleting row:", error);
      alert(t("maintenance.history.deleteError")); // Add this translation key
    }
  };


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

          <div className="flex justify-between mt-4">
             <div>
               {user?.role === "Supervisor" && (
                 <button
                   onClick={() => setDeleteMode(!deleteMode)}
                   className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium ${
                     deleteMode
                       ? "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                       : "bg-gray-700 hover:bg-gray-600 text-white"
                   }`}
                 >
                   <Trash2 size={14} />
                   {deleteMode ? t("maintenance.history.exitDeleteMode") : t("maintenance.history.enterDeleteMode")}
                 </button>
               )}
             </div>
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
        {paginatedRows.length === 0 ? (
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
              {paginatedRows.map((r, i) => (
                <div
                   key={r.__row_index} // Use __row_index for stable key
                   className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 shadow-lg relative" // Added relative for delete button positioning
                >
                  {deleteMode && user?.role === "Supervisor" && (
                    <button
                      onClick={() => handleDelete(i)} // Pass index within current page
                      className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                    >
                      <XIcon size={16} />
                    </button>
                  )}

                  <div
                     onClick={() =>
                       setExpandedIndex(expandedIndex === i ? null : i)
                     }
                     className="cursor-pointer"
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
                      <span className="text-xs font-semibold text-gray-300">
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

                    {expandedIndex === i && (
                      <>
                        {/* Comments */}
                        <div className="mt-3 text-sm">
                          <span className="text-gray-400">
                            {t("maintenance.history.table.comments")}:
                          </span>{" "}
                          {r["Comments"] || "---"}
                        </div>

                        {/* Photos */}
                        <div className="flex gap-3 mt-3">
                          {[
                            {
                              field: "Photo Before",
                              label: t("maintenance.history.table.photoBefore"),
                            },
                            {
                              field: "Photo After",
                              label: t("maintenance.history.table.photoAfter"),
                            },
                            {
                              field: "Photo Repair/Problem",
                              label: t("maintenance.history.table.photoProblem"),
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
                                      <ExternalLink className="w-5 h-5 text-emerald-400" />
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
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-700 shadow-2xl">
              <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                  <tr>
                    {deleteMode && user?.role === "Supervisor" && (
                      <th className="p-4 text-center text-sm font-semibold text-gray-300">
                        {t("maintenance.history.table.actions")}
                      </th>
                    )}
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
                  {paginatedRows.map((r, i) => (
                    <tr
                      key={r.__row_index} // Use __row_index for stable key
                      className={`border-t border-gray-700 hover:bg-white/5 transition-colors ${
                        i % 2 === 0 ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      {deleteMode && user?.role === "Supervisor" && (
                        <td className="p-4 text-center">
                           <button
                             onClick={() => handleDelete(i)} // Pass index within current page
                             className="text-red-500 hover:text-red-400"
                           >
                             <XIcon size={16} />
                           </button>
                         </td>
                      )}
                      <td className="p-4 text-sm text-gray-400">{startIndex + i + 1}</td>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {t("common.previous") || "Previous"}
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-4 py-2 rounded-lg transition ${
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-700 hover:bg-gray-600 text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {t("common.next") || "Next"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
