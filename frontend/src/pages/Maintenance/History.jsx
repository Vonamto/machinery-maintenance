// frontend/src/pages/Maintenance/History.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  History as HistoryIcon,
  Wrench,
  XCircle,
  CheckCircle,
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

export default function MaintenanceHistory() {
  const { user } = useAuth();
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
        const res = await fetch(
          `${CONFIG.BACKEND_URL}/api/Maintenance_Log`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setRows(data.reverse());
        }
      } catch (err) {
        console.error("Error loading maintenance history:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------------- Restore filters ---------------- */

  useEffect(() => {
    const savedFilter = sessionStorage.getItem("maintenanceFilter");
    if (savedFilter) {
      try {
        const parsed = JSON.parse(savedFilter);
        setFilters((f) => ({ ...f, ...parsed }));
        sessionStorage.removeItem("maintenanceFilter");
      } catch (err) {
        console.error("Error parsing saved filter:", err);
      }
    }
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
      Array.from(
        new Set(rows.map((r) => r["Driver"]).filter(Boolean))
      ).sort(),
    [rows]
  );

  /* ---------------- Filter rows ---------------- */

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const date = r["Date"];
      const model = r["Model / Type"] || "";
      const plate = r["Plate Number"] || "";
      const driver = r["Driver"] || "";

      const matchModel = !filters.model || model === filters.model;
      const matchPlate = !filters.plate || plate === filters.plate;
      const matchDriver = !filters.driver || driver === filters.driver;

      let matchDate = true;
      if (filters.from && date < filters.from) matchDate = false;
      if (filters.to && date > filters.to) matchDate = false;

      return matchModel && matchPlate && matchDriver && matchDate;
    });
  }, [rows, filters]);

  const resetFilters = () => {
    setFilters({ model: "", plate: "", driver: "", from: "", to: "" });
  };

  /* ---------------- Translation helpers ---------------- */

  const translateDescription = (value) => {
    if (!value) return "---";

    const cleaning = t(`cleaningTypes.${value}`, { defaultValue: null });
    if (cleaning) return cleaning;

    const request = t(`requestTypes.${value}`, { defaultValue: null });
    if (request) return request;

    return value;
  };

  const getStatusBadge = (status) => {
    const lower = (status || "").toLowerCase();

    const styles = {
      completed: {
        bg: "bg-green-500/20",
        text: "text-green-300",
        icon: <CheckCircle size={14} />,
      },
      "in progress": {
        bg: "bg-yellow-500/20",
        text: "text-yellow-300",
        icon: <HistoryIcon size={14} />,
      },
      rejected: {
        bg: "bg-red-500/20",
        text: "text-red-300",
        icon: <XCircle size={14} />,
      },
    };

    const style = styles[lower] || {
      bg: "bg-gray-500/20",
      text: "text-gray-300",
      icon: <HistoryIcon size={14} />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {style.icon}
        {status ? t(`status.${status}`, status) : "---"}
      </span>
    );
  };

  /* ---------------- Loading ---------------- */

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4" />
          <p className="text-lg">
            {t("maintenance.history.loading")}
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        {/* Header */}
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

        {/* Filters */}
        <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-4 mb-8">
          <div className="grid md:grid-cols-5 sm:grid-cols-2 gap-4">
            <select
              value={filters.model}
              onChange={(e) =>
                setFilters((f) => ({ ...f, model: e.target.value }))
              }
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm"
            >
              <option value="">
                {t("maintenance.history.filters.model")}
              </option>
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
              <option value="">
                {t("maintenance.history.filters.plate")}
              </option>
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
              <option value="">
                {t("maintenance.history.filters.driver")}
              </option>
              {driverOptions.map((d) => (
                <option key={d}>{d}</option>
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
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400"
            >
              <XCircle size={14} />
              {t("maintenance.history.filters.reset")}
            </button>
          </div>
        </div>

        {/* Table */}
        {filteredRows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <HistoryIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {t("maintenance.history.noResults")}
            </p>
          </div>
        ) : (
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
                    "status",
                    "comments",
                    "photoBefore",
                    "photoAfter",
                    "photoProblem",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-4 text-left text-sm text-gray-300"
                    >
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
                    <td className="p-4">
                      {getStatusBadge(r["Status"])}
                    </td>
                    <td className="p-4 text-sm">
                      {r["Comments"] || "---"}
                    </td>

                    {[
                      "Photo Before",
                      "Photo After",
                      "Photo Repair/Problem",
                    ].map((field) => (
                      <td key={field} className="p-4">
                        {r[field] ? (
                          <a
                            href={r[field]}
                            target="_blank"
                            rel="noreferrer"
                          >
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
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
