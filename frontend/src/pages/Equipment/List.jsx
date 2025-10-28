// frontend/src/pages/Equipment/List.jsx

import React, { useEffect, useState } from "react";
import { ArrowLeft, Truck, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";

export default function EquipmentList() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Equipment_List`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setRows(data);
      } catch (err) {
        console.error("Error loading equipment list:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Navigate to Maintenance History with filters
  const handleFilterClick = (filterType, value) => {
    // Store filter in sessionStorage so MaintenanceHistory can read it
    sessionStorage.setItem("maintenanceFilter", JSON.stringify({ [filterType]: value }));
    navigate("/maintenance/history");
  };

  const getStatusBadge = (status) => {
    const lower = (status || "").toLowerCase();
    const styles = {
      active: {
        bg: "bg-green-500/20",
        text: "text-green-300",
      },
      inactive: {
        bg: "bg-gray-500/20",
        text: "text-gray-300",
      },
      maintenance: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-300",
      },
    };

    const style = styles[lower] || styles["active"];

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {status || "Active"}
      </span>
    );
  };

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-lg">Loading equipment list...</p>
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
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-600 to-yellow-500 shadow-lg shadow-orange-500/40">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">
              Equipment List
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Click on Model, Plate, or Driver to view maintenance history
            </p>
          </div>
        </div>

        {/* main content */}
        {rows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <Truck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No equipment found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700 shadow-2xl">
            <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                <tr>
                  {[
                    "#",
                    "Model / Type",
                    "Plate Number",
                    "Driver 1",
                    "Driver 2",
                    "Status",
                    "Notes",
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
                    
                    {/* Clickable Model */}
                    <td className="p-4 text-sm">
                      <button
                        onClick={() => handleFilterClick("model", r["Model / Type"])}
                        className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors group"
                      >
                        {r["Model / Type"]}
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    {/* Clickable Plate Number */}
                    <td className="p-4 text-sm font-mono">
                      <button
                        onClick={() => handleFilterClick("plate", r["Plate Number"])}
                        className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors group"
                      >
                        {r["Plate Number"]}
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    {/* Clickable Driver 1 */}
                    <td className="p-4 text-sm">
                      {r["Driver 1"] ? (
                        <button
                          onClick={() => handleFilterClick("driver", r["Driver 1"])}
                          className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors group"
                        >
                          {r["Driver 1"]}
                          <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <span className="text-gray-500">---</span>
                      )}
                    </td>

                    {/* Clickable Driver 2 */}
                    <td className="p-4 text-sm">
                      {r["Driver 2"] ? (
                        <button
                          onClick={() => handleFilterClick("driver", r["Driver 2"])}
                          className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors group"
                        >
                          {r["Driver 2"]}
                          <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <span className="text-gray-500">---</span>
                      )}
                    </td>

                    <td className="p-4">{getStatusBadge(r["Status"])}</td>
                    
                    <td className="p-4 text-sm max-w-xs truncate">
                      {r["Notes"] || (
                        <span className="text-gray-500">---</span>
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
