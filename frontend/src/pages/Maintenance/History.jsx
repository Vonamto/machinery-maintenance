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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // filters
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

  // derive dropdown options dynamically
  const modelOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r["Model / Type"]).filter(Boolean))
      ).sort(),
    [rows]
  );

  const plateOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r["Plate Number"]).filter(Boolean))).sort(),
    [rows]
  );

  const driverOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r["Driver"]).filter(Boolean))).sort(),
    [rows]
  );

  // apply filters
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
        {status || "—"}
      </span>
    );
  };

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-lg">Loading maintenance history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto p-6">
        {/* back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back
        </button>

        {/* header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 shadow-lg shadow-green-500/40">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              Maintenance History
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              View and filter completed maintenance logs
            </p>
          </div>
        </div>

        {/* filters */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 mb-8 shadow-lg">
          <div className="grid md:grid-cols-5 sm:grid-cols-2 gap-4">
            <select
              value={filters.model}
              onChange={(e) => setFilters((f) => ({ ...f, model: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">Model</option>
              {modelOptions.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            <select
              value={filters.plate}
              onChange={(e) => setFilters((f) => ({ ...f, plate: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">Plate</option>
              {plateOptions.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>

            <select
              value={filters.driver}
              onChange={(e) => setFilters((f) => ({ ...f, driver: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">Driver</option>
              {driverOptions.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium transition-all"
            >
              <XCircle size={14} />
              Reset Filters
            </button>
          </div>
        </div>

        {/* main content */}
        {filteredRows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <HistoryIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No records match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700 shadow-2xl">
            <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                <tr>
                  {[
                    "#",
                    "Date",
                    "Model / Type",
                    "Plate Number",
                    "Driver",
                    "Performed By",
                    "Description",
                    "Completion Date",
                    "Status",
                    "Comments",
                    "Photo Before",
                    "Photo After",
                    "Photo Repair/Problem",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-4 text-left text-sm font-semibold text-gray-300"
                    >
                      {h}
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
                    <td className="p-4 text-sm font-mono">{r["Plate Number"]}</td>
                    <td className="p-4 text-sm">{r["Driver"]}</td>
                    <td className="p-4 text-sm">{r["Performed By"]}</td>
                    <td className="p-4 text-sm max-w-xs truncate">
                      {r["Description of Work"] || (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    <td className="p-4 text-sm">
                      {r["Completion Date"] || (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    <td className="p-4">{getStatusBadge(r["Status"])}</td>

                    <td className="p-4 text-sm max-w-xs truncate">
                      {r["Comments"] || (
                        <span className="text-gray-500">—</span>
                      )}
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
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                                <ExternalLink className="w-6 h-6 text-emerald-400" />
                              </div>
                            </a>
                          ) : (
                            <span className="text-gray-500 text-sm">—</span>
                          )}
                        </td>
                      )
                    )}
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
