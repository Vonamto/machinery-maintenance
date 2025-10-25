// frontend/src/pages/Maintenance/History.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
// Import the custom hook instead of the context object
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";
import { getThumbnailUrl } from "@/utils/imageUtils"; // Import the shared thumbnail utility

export default function MaintenanceHistory() {
  // Use the custom hook
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // No need to redefine getThumbnailUrl here if it's in utils/imageUtils.js
  // const getThumbnailUrl = (url) => { ... }; // Remove this local definition

  return (
    // Apply main theme background and text color
    <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto p-6">
        {/* Back button - Apply theme color */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-theme-primary-500 hover:text-theme-primary-400 mb-6 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>
        {/* Title - Keep the gradient for visual appeal */}
        <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
          Maintenance History
        </h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto border border-theme-border-light rounded-lg"> {/* Apply theme border color */}
            <table className="w-full text-sm text-left">
              <thead className="bg-theme-background-secondary"> {/* Apply theme color for header */}
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Model / Type</th>
                  <th className="p-2">Plate Number</th>
                  <th className="p-2">Driver</th>
                  <th className="p-2">Performed By</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Comments</th>
                  <th className="p-2">Photo Before</th>
                  <th className="p-2">Photo After</th>
                  <th className="p-2">Photo Repair/Problem</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center p-4 text-theme-text-muted"> {/* Apply theme color for muted text */}
                      No maintenance records yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    // Apply alternating row colors using theme colors
                    <tr key={i} className={i % 2 === 0 ? "bg-theme-background-surface" : "bg-theme-background-secondary/30"}>
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{r["Date"]}</td>
                      <td className="p-2">{r["Model / Type"]}</td>
                      <td className="p-2">{r["Plate Number"]}</td>
                      <td className="p-2">{r["Driver"]}</td>
                      <td className="p-2">{r["Performed By"]}</td>
                      <td className="p-2">{r["Description of Work"]}</td>
                      <td className="p-2">{r["Comments"]}</td>
                      {["Photo Before", "Photo After", "Photo Repair/Problem"].map((field) => (
                        <td key={`${i}-${field}`}> {/* Use a unique key combining row index and field name */}
                          {r[field] ? (
                            <a
                              href={r[field]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group block"
                            >
                              {/* Use the imported thumbnail utility */}
                              <img
                                src={getThumbnailUrl(r[field])}
                                alt={field}
                                className="h-16 w-16 object-cover rounded border border-theme-border-light group-hover:scale-110 transition-transform duration-150" // Apply theme border color
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div className="hidden h-16 w-16 items-center justify-center bg-theme-background-secondary rounded border border-theme-border-light group-hover:bg-theme-background-primary">
                                <ExternalLink size={20} className="text-theme-primary-400" /> {/* Apply theme color for icon */}
                              </div>
                            </a>
                          ) : (
                            <span className="text-theme-text-muted p-2">---</span> {/* Apply theme color for placeholder, added p-2 for consistency */}
                          )}
                        </td>
                      ))}
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
