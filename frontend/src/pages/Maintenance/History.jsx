// frontend/src/pages/Maintenance/History.jsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  History as HistoryIcon,
  Wrench,
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

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 shadow-lg shadow-green-500/40">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              Maintenance History
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              View all completed maintenance and repair logs
            </p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4 mb-4">
            <p className="text-cyan-400">Loading history...</p>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <HistoryIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              No maintenance records found.
            </p>
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
                {rows.map((r, i) => (
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
                    <td className="p-4 text-sm">{r["Performed By"]}</td>
                    <td className="p-4 text-sm max-w-xs truncate">
                      {r["Description of Work"] || (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
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
