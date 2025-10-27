// frontend/src/pages/Requests/GreaseOil/History.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Droplets, CheckCircle, XCircle, Filter, XCircle } from "lucide-react";
import Navbar from "../../../components/Navbar"; // Adjusted path
import { useAuth } from "../../../context/AuthContext"; // Adjusted path
import { useNavigate } from "react-router-dom"; // Adjusted path
import CONFIG from "../../../config"; // Adjusted path

const getThumbnailUrl = (url) => {
  if (!url) return null;
  const match = url.match(/id=([^&]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  }
  return url;
};

export default function GreaseOilHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [filters, setFilters] = useState({
    model: "",
    plate: "",
    driver: "",
    from: "",
    to: "",
    status: "",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Grease_Oil_Requests`, { // Updated endpoint
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          const dataWithIndex = data.map((row, originalIndex) => ({
            ...row,
            __original_index: originalIndex,
          }));
          // ✅ show only completed/rejected requests (completion date exists)
          const completedRequests = dataWithIndex.filter((row) => {
            const completionDate = row["Completion Date"];
            return completionDate && completionDate.trim() !== "";
          });
          setRows(completedRequests.reverse());
        }
      } catch (err) {
        console.error("Error loading grease/oil requests history:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Apply filters
  const filteredRows = React.useMemo(() => {
    return rows.filter((r) => {
      let matchModel = !filters.model || r["Model / Type"]?.includes(filters.model);
      let matchPlate = !filters.plate || r["Plate Number"]?.includes(filters.plate);
      let matchDriver = !filters.driver || r["Driver"]?.includes(filters.driver);
      let lowerStatus = (r["Status"] || "").toLowerCase();
      let matchStatus = !filters.status || lowerStatus.includes(filters.status.toLowerCase());
      let matchDate = true;
      if (filters.from) {
        const date = new Date(r["Completion Date"]);
        const from = new Date(filters.from);
        if (date < from) matchDate = false;
      }
      if (filters.to) {
        const date = new Date(r["Completion Date"]);
        const to = new Date(filters.to);
        if (date > to) matchDate = false;
      }
      return matchModel && matchPlate && matchDriver && matchStatus && matchDate;
    });
  }, [rows, filters]);

  const resetFilters = () => setFilters({
    model: "",
    plate: "",
    driver: "",
    from: "",
    to: "",
    status: "",
  });

  const getStatusBadge = (status) => {
    const lower = (status || "").toLowerCase();
    const styles = {
      completed: {
        bg: "bg-green-500/20",
        text: "text-green-300",
        icon: <CheckCircle size={14} />,
      },
      rejected: {
        bg: "bg-red-500/20",
        text: "text-red-300",
        icon: <XCircle size={14} />,
      },
    };
    const style = styles[lower] || { bg: "bg-gray-500/20", text: "text-gray-300", icon: <XCircle size={14} /> };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {status || "Unknown"}
      </span>
    );
  };

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-lg">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/50">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Grease / Oil Requests History
            </h1>
            <p className="text-gray-400 text-sm mt-1">View and filter completed or rejected requests</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 mb-8 shadow-lg">
          <div className="grid md:grid-cols-6 sm:grid-cols-2 gap-4">
            <select
              value={filters.model}
              onChange={(e) => setFilters((f) => ({ ...f, model: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="">All Models</option>
              {/* Assuming models are available from cache or a similar source, you'd populate them here */}
              {/* For now, leaving it empty or you can add options dynamically */}
            </select>
            <select
              value={filters.plate}
              onChange={(e) => setFilters((f) => ({ ...f, plate: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="">All Plates</option>
              {/* Populate dynamically */}
            </select>
            <select
              value={filters.driver}
              onChange={(e) => setFilters((f) => ({ ...f, driver: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="">All Drivers</option>
              {/* Populate dynamically */}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium transition-all"
            >
              <XCircle size={14} />Reset Filters
            </button>
          </div>
        </div>

        {/* Table */}
        {filteredRows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              No matching requests found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700 shadow-2xl">
            <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                <tr>
                  {[
                    "Request Date",
                    "Model / Type",
                    "Plate Number",
                    "Driver",
                    "Request Type", // Changed field name
                    "Status",
                    "Handled By",
                    "Appointment Date",
                    "Completion Date",
                    "Comments",
                    "Odometer Photo - Before", // Changed field name
                    "Odometer Photo - After", // Changed field name
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
                {filteredRows.map((r) => (
                  <tr
                    key={r.__original_index}
                    className={`border-t border-gray-700 hover:bg-white/5 transition-colors ${(r.__original_index % 2 === 0 ? "bg-white/[0.02]" : "")}`}
                  >
                    <td className="p-4 text-sm">{r["Request Date"]}</td>
                    <td className="p-4 text-sm">{r["Model / Type"]}</td>
                    <td className="p-4 text-sm font-mono">{r["Plate Number"]}</td>
                    <td className="p-4 text-sm">{r["Driver"]}</td>
                    <td className="p-4 text-sm max-w-xs truncate">{r["Request Type"]}</td> {/* Changed field name */}
                    <td className="p-4">{getStatusBadge(r["Status"])}</td>
                    <td className="p-4 text-sm">{r["Handled By"] || <span className="text-gray-500">—</span>}</td>
                    <td className="p-4 text-sm">{r["Appointment Date"] || <span className="text-gray-500">—</span>}</td>
                    <td className="p-4 text-sm">{r["Completion Date"] || <span className="text-gray-500">—</span>}</td>
                    <td className="p-4 text-sm max-w-xs truncate">{r["Comments"] || <span className="text-gray-500">—</span>}</td>
                    <td className="p-4"> {/* Photo Before column -> Odometer Photo - Before */}
                      {r["Photo Before"] ? ( // Accessing internal field name
                        <a
                          href={r["Photo Before"]} // Accessing internal field name
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group block"
                        >
                          <img
                            src={getThumbnailUrl(r["Photo Before"])} // Accessing internal field name
                            alt="Odometer Photo - Before"
                            className="h-16 w-16 object-cover rounded-lg border border-gray-600 group-hover:border-cyan-500 group-hover:scale-110 transition-all duration-200 shadow-lg"
                          />
                          <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                            <ExternalLink className="w-6 h-6 text-cyan-400" />
                          </div>
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">No Photo</span>
                      )}
                    </td>
                    <td className="p-4"> {/* Photo After column -> Odometer Photo - After */}
                      {r["Photo After"] ? ( // Accessing internal field name
                        <a
                          href={r["Photo After"]} // Accessing internal field name
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group block"
                        >
                          <img
                            src={getThumbnailUrl(r["Photo After"])} // Accessing internal field name
                            alt="Odometer Photo - After"
                            className="h-16 w-16 object-cover rounded-lg border border-gray-600 group-hover:border-cyan-500 group-hover:scale-110 transition-all duration-200 shadow-lg"
                          />
                          <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                            <ExternalLink className="w-6 h-6 text-cyan-400" />
                          </div>
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">No Photo</span>
                      )}
                    </td>
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
