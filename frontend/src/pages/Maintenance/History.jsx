// frontend/src/pages/Maintenance/History.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
          Maintenance History
        </h3>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto border border-white/10 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/10">
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
                    <td colSpan="11" className="text-center p-4 text-gray-400">
                      No maintenance records yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white/5" : "bg-transparent"}
                    >
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{r["Date"]}</td>
                      <td className="p-2">{r["Model / Type"]}</td>
                      <td className="p-2">{r["Plate Number"]}</td>
                      <td className="p-2">{r["Driver"]}</td>
                      <td className="p-2">{r["Performed By"]}</td>
                      <td className="p-2">{r["Description of Work"]}</td>
                      <td className="p-2">{r["Comments"]}</td>
                      {["Photo Before", "Photo After", "Photo Repair/Problem"].map(
                        (f) => (
                          <td key={f} className="p-2">
                            {r[f] ? (
                              <a
                                href={r[f]}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={r[f]}
                                  alt={f}
                                  className="h-16 w-16 object-cover rounded border border-white/20 hover:scale-110 transition-transform duration-150"
                                />
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        )
                      )}
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
