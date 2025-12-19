// frontend/src/pages/Maintenance/History.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  ExternalLink,
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
  const { t, i18n } = useTranslation();
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

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const date = r["Date"];
      const model = r["Model / Type"] || "";
      const plate = r["Plate Number"] || "";
      const driver = r["Driver"] || "";

      if (filters.model && model !== filters.model) return false;
      if (filters.plate && plate !== filters.plate) return false;
      if (filters.driver && driver !== filters.driver) return false;
      if (filters.from && date < filters.from) return false;
      if (filters.to && date > filters.to) return false;

      return true;
    });
  }, [rows, filters]);

  const resetFilters = () =>
    setFilters({ model: "", plate: "", driver: "", from: "", to: "" });

  // ✅ FINAL CORRECT TRANSLATION LOGIC
  const translateDescription = (value) => {
    if (!value) return "---";

    const normalized = value.trim().replace(/\s+/g, " ");

    const requestAliases = {
      "Oil service": "Oil Service",
      "Grease service": "Grease Service",
      "Grease Serviec": "Grease Service",
      "Full Service": "Full Service (Oil + Greasing)",
      "Full Service (Oil + Grease)": "Full Service (Oil + Greasing)",
      "Oil / Grease": "Full Service (Oil + Greasing)",
    };

    const finalKey = requestAliases[normalized] || normalized;

    const cleaningKey = `cleaningTypes.${finalKey}`;
    const requestKey = `requestTypes.${finalKey}`;

    if (i18n.exists(cleaningKey)) return t(cleaningKey);
    if (i18n.exists(requestKey)) return t(requestKey);

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
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {status ? t(`status.${status}`, status) : "---"}
      </span>
    );
  };

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <p>{t("maintenance.history.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-cyan-400 mb-6">
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        <h1 className="text-3xl font-bold mb-6">
          {t("maintenance.history.title")}
        </h1>

        <table className="min-w-full bg-gray-800/50 rounded-xl">
          <tbody>
            {filteredRows.map((r, i) => (
              <tr key={i} className="border-t border-gray-700">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{translateDescription(r["Description of Work"])}</td>
                <td className="p-3">{getStatusBadge(r["Status"])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
