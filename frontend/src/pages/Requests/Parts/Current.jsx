// frontend/src/pages/Requests/Parts/Current.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";

export default function PartsCurrentRequests() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const canEdit = user?.role === "Supervisor" || user?.role === "Mechanic";

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/Requests_Parts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const pending = data.filter((r) => !r["Completion Date"]);
        setRows(pending.reverse());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (index, newStatus, handledBy) => {
    const row = rows[index];
    const rowIndex = index + 2;
    
    const payload = {
      Status: newStatus,
      "Handled By": handledBy || row["Handled By"] || "",
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/edit/Requests_Parts/${rowIndex}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("✅ Status updated successfully.");
        loadRequests();
      } else {
        alert("❌ Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Network error updating status.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-background-primary via-theme-background-secondary to-theme-background text-theme-text">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-theme-primary-500 hover:text-theme-primary-600 mb-6 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-theme-accent-400 to-orange-500">
          Current Parts Requests
        </h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto border border-theme-border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-theme-background-secondary">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Request Date</th>
                  <th className="p-2">Model / Type</th>
                  <th className="p-2">Plate Number</th>
                  <th className="p-2">Driver</th>
                  <th className="p-2">Requested Parts</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Handled By</th>
                  <th className="p-2">Comments</th>
                  <th className="p-2">Photo</th>
                  {canEdit && <th className="p-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? "11" : "10"} className="text-center p-4 text-theme-text-secondary">
                      No pending requests.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white/5" : "bg-transparent"}>
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{r["Request Date"]}</td>
                      <td className="p-2">{r["Model / Type"]}</td>
                      <td className="p-2">{r["Plate Number"]}</td>
                      <td className="p-2">{r["Driver"]}</td>
                      <td className="p-2">{r["Requested Parts"]}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          r.Status === "Pending" ? "bg-yellow-500/20 text-yellow-300" :
                          r.Status === "In Progress" ? "bg-theme-primary-500/20 text-theme-primary-400" :
                          "bg-theme-text-muted/20 text-theme-text-secondary"
                        }`}>
                          {r.Status || "Pending"}
                        </span>
                      </td>
                      <td className="p-2">{r["Handled By"]}</td>
                      <td className="p-2">{r["Comments"]}</td>
                      <td className="p-2">
                        {r["Attachment Photo"] ? (
                          <a href={r["Attachment Photo"]} target="_blank" rel="noopener noreferrer">
                            <img src={r["Attachment Photo"]} alt="Attachment" className="h-12 w-12 object-cover rounded border border-theme-border hover:scale-110 transition-transform" />
                          </a>
                        ) : (
                          <span className="text-theme-text-muted">---</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="p-2">
                          <select
                            value={r.Status || "Pending"}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              const handledBy = prompt("Enter handler name (mechanic/supervisor):", user?.full_name || "");
                              if (handledBy) {
                                handleStatusChange(i, newStatus, handledBy);
                              }
                            }}
                            className="text-xs p-1 rounded bg-theme-background-card border border-theme-border text-theme-text"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
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
