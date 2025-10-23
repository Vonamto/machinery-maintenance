// frontend/src/pages/Maintenance/History.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import CONFIG from "../../config";

/**
 * Maintenance history viewer
 * - GET /api/Maintenance_Log (protected)
 * - Displays rows in a simple table, newest first
 */

export default function MaintenanceHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Maintenance_Log`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // backend returns JSON array
        if (Array.isArray(data)) {
          // show newest first
          setRows(data.reverse());
        } else {
          setRows([]);
        }
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
      <div className="max-w-6xl mx-auto p-6">
        <h3 className="text-2xl font-bold mb-4">Maintenance History</h3>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="overflow-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Model</th>
                  <th className="p-2">Plate</th>
                  <th className="p-2">Driver</th>
                  <th className="p-2">Performed By</th>
                  <th className="p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white/2" : ""}>
                    <td className="p-2 align-top">{r["Date"]}</td>
                    <td className="p-2 align-top">{r["Model / Type"]}</td>
                    <td className="p-2 align-top">{r["Plate Number"]}</td>
                    <td className="p-2 align-top">{r["Driver"]}</td>
                    <td className="p-2 align-top">{r["Performed By"]}</td>
                    <td className="p-2 align-top">{r["Description of Work"]}</td>
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
