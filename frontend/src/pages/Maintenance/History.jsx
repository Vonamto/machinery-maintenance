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

const getThumbnailUrl = (url) => {
  if (!url) return null;
  const match = url.match(/id=([^&]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  }
  return url;
};

export default function MaintenanceHistory() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    model: "",
    plate: "",
    driver: "",
    from: "",
    to: "",
  });

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

  const resetFilters = () =>
    setFilters({ model: "", plate: "", driver: "", from: "", to: "" });

  // ✅ FIXED TRANSLATION LOGIC
  const translateDescription = (value) => {
    if (!value) return "---";

    const cleaning = t(`cleaningTypes.${value}`);
    if (cleaning !== value) return cleaning;

    const request = t(`requestTypes.${value}`);
    if (request !== value) return request;

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

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>{t("maintenance.history.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="text-cyan-400 mb-6">
          <ArrowLeft size={16} /> {t("common.back")}
        </button>

        <h1 className="text-3xl font-bold mb-1">
          {t("maintenance.history.title")}
        </h1>
        <p className="text-gray-400 mb-6">
          {t("maintenance.history.subtitle")}
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800">
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
                  <th key={h} className="p-3 text-left">
                    {t(`maintenance.history.table.${h}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i} className="border-t border-gray-700">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">{r["Date"]}</td>
                  <td className="p-3">{r["Model / Type"]}</td>
                  <td className="p-3">{r["Plate Number"]}</td>
                  <td className="p-3">{r["Driver"]}</td>
                  <td className="p-3">{r["Performed By"]}</td>
                  <td className="p-3">
                    {translateDescription(r["Description of Work"])}
                  </td>
                  <td className="p-3">{r["Completion Date"] || "---"}</td>
                  <td className="p-3">{getStatusBadge(r["Status"])}</td>
                  <td className="p-3">{r["Comments"] || "---"}</td>
                  {["Photo Before", "Photo After", "Photo Repair/Problem"].map(
                    (field) => (
                      <td key={field} className="p-3">
                        {r[field] ? (
                          <img
                            src={getThumbnailUrl(r[field])}
                            className="h-12 w-12 rounded"
                          />
                        ) : (
                          "---"
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
