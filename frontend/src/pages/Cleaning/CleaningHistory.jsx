// frontend/src/pages/Cleaning/CleaningHistory.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Camera, Calendar, Car, User, Droplets, Search, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";

export default function CleaningHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    model: "",
    plate: "",
    driver: "",
  });

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/read/Cleaning_Log");
        const data = await res.json();
        if (data.status === "success") {
          // Add a temporary index for unique keys if Row Number isn't present
          setRows(data.data.map((row, idx) => ({ ...row, __original_index: idx })));
        } else {
          setError(data.message || "Error fetching data");
        }
      } catch (err) {
        console.error("Error loading cleaning history:", err);
        setError("Network error loading history.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Apply filters
  const filteredRows = rows.filter(row => {
    const rowDate = row.Date; // Format: YYYY-MM-DD
    if (filters.dateFrom && rowDate < filters.dateFrom) return false;
    if (filters.dateTo && rowDate > filters.dateTo) return false;
    if (filters.model && row["Model / Type"] !== filters.model) return false;
    if (filters.plate && row["Plate Number"] !== filters.plate) return false;
    if (filters.driver && row.Driver !== filters.driver) return false;
    return true;
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      model: "",
      plate: "",
      driver: "",
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
              🧼 Cleaning Log History
            </h1>
            <p className="text-gray-400 mt-2">View all recorded cleaning activities</p>
          </div>
          <button
            onClick={() => navigate("/cleaning/form")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-500 hover:from-sky-700 hover:to-indigo-600 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50"
          >
            <Droplets size={18} />
            Add New Log
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
              <Search className="w-5 h-5" /> Filters
            </h2>
            {(filters.dateFrom || filters.dateTo || filters.model || filters.plate || filters.driver) && (
              <button
                onClick={clearFilters}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <X size={16} /> Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Model</label>
              <select
                value={filters.model}
                onChange={(e) => handleFilterChange("model", e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50"
              >
                <option value="">All Models</option>
                {[...new Set(rows.map(r => r["Model / Type"]).filter(Boolean))].sort().map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Plate</label>
              <select
                value={filters.plate}
                onChange={(e) => handleFilterChange("plate", e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50"
              >
                <option value="">All Plates</option>
                {[...new Set(rows.map(r => r["Plate Number"]).filter(Boolean))].sort().map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Driver</label>
              <select
                value={filters.driver}
                onChange={(e) => handleFilterChange("driver", e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50"
              >
                <option value="">All Drivers</option>
                {[...new Set(rows.map(r => r.Driver).filter(Boolean))].sort().map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cleaned By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Photos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                      No cleaning logs found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.__original_index} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row.Date}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row["Model / Type"]}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row["Plate Number"]}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row.Driver}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row["Cleaned By"]}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{row["Cleaning Type"]}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {row["Photo Before"] && (
                            <a href={row["Photo Before"]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                              <Camera size={14} /> B
                            </a>
                          )}
                          {row["Photo After"] && (
                            <a href={row["Photo After"]} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 flex items-center gap-1">
                              <Camera size={14} /> A
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
