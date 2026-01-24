import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchWithAuth } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useCache } from "../../context/CacheContext";

const ITEMS_PER_PAGE = 10;

export default function ChecklistHistory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { equipment, loading: cacheLoading } = useCache();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    plate: "",
    model: "",
    from: "",
    to: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);

  /* ===================== LOAD DATA ===================== */
  useEffect(() => {
    if (cacheLoading) return;

    async function loadData() {
      try {
        const data = await fetchWithAuth("/api/Checklist_Log");

        let parsed = data.map((row, index) => ({
          id: index,
          ...row,
          checklist: JSON.parse(row["Checklist Data"] || "{}"),
        }));

        /* Driver restriction */
        if (user.role === "Driver") {
          const driverPlates = equipment
            .filter(
              e =>
                e["Driver 1"] === user.full_name ||
                e["Driver 2"] === user.full_name
            )
            .map(e => e["Plate Number"]);

          parsed = parsed.filter(r =>
            driverPlates.includes(r["Plate Number"])
          );
        }

        setRows(parsed);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [cacheLoading, equipment, user]);

  /* ===================== FILTERING ===================== */
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (filters.plate && r["Plate Number"] !== filters.plate)
        return false;

      if (
        filters.model &&
        r["Model / Type"] !== filters.model
      )
        return false;

      if (filters.from && r.Date < filters.from) return false;
      if (filters.to && r.Date > filters.to) return false;

      return true;
    });
  }, [rows, filters]);

  /* ===================== PAGINATION ===================== */
  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);

  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* ===================== RENDER ===================== */
  if (loading || cacheLoading) {
    return (
      <div className="p-6 text-center">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">
          {t("checklist.history.title")}
        </h1>
        <p className="text-sm opacity-70">
          {t("checklist.history.subtitle")}
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <select
          value={filters.plate}
          onChange={e =>
            setFilters({ ...filters, plate: e.target.value })
          }
        >
          <option value="">
            {t("checklist.filters.plate")}
          </option>
          {[...new Set(rows.map(r => r["Plate Number"]))].map(
            p => (
              <option key={p} value={p}>
                {p}
              </option>
            )
          )}
        </select>

        <select
          value={filters.model}
          onChange={e =>
            setFilters({ ...filters, model: e.target.value })
          }
        >
          <option value="">
            {t("checklist.filters.model")}
          </option>
          {[...new Set(rows.map(r => r["Model / Type"]))].map(
            m => (
              <option key={m} value={m}>
                {m}
              </option>
            )
          )}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={e =>
            setFilters({ ...filters, from: e.target.value })
          }
        />

        <input
          type="date"
          value={filters.to}
          onChange={e =>
            setFilters({ ...filters, to: e.target.value })
          }
        />
      </div>

      {/* Accordion */}
      <div className="space-y-2">
        {paginatedRows.map(row => {
          const open = expandedRow === row.id;

          return (
            <div
              key={row.id}
              className="border rounded-lg overflow-hidden"
            >
              <button
                className="w-full flex justify-between p-3 bg-gray-100"
                onClick={() =>
                  setExpandedRow(open ? null : row.id)
                }
              >
                <span>
                  {row.Date} — {row["Plate Number"]} (
                  {row["Equipment Type"]})
                </span>
                <span>{open ? "−" : "+"}</span>
              </button>

              {open && (
                <div className="p-3 space-y-4">
                  {Object.entries(row.checklist).map(
                    ([sectionId, items]) => (
                      <div key={sectionId}>
                        <h3 className="font-semibold mb-2">
                          {t(sectionId)}
                        </h3>

                        <ul className="space-y-1">
                          {Object.entries(items).map(
                            ([itemId, item]) => (
                              <li
                                key={itemId}
                                className="flex justify-between items-center"
                              >
                                <span>{t(itemId)}</span>
                                <span>
                                  {item.status === "ok"
                                    ? "✅"
                                    : item.status === "warning"
                                    ? "⚠️"
                                    : "❌"}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1
                  ? "bg-black text-white"
                  : ""
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
