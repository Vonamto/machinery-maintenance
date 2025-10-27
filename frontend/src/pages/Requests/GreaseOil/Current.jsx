// frontend/src/pages/Requests/GreaseOil/Current.jsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera,
  Upload,
} from "lucide-react";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCache } from "../../../context/CacheContext";
import CONFIG from "../../../config";

const getThumbnailUrl = (url) => {
  if (!url) return null;
  const match = url.match(/id=([^&]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  }
  return url;
};

const formatAppointmentDate = (rawDateStr) => {
  if (!rawDateStr) return rawDateStr;
  const date = new Date(rawDateStr);
  if (isNaN(date.getTime())) {
    console.warn(`Could not parse Appointment Date: ${rawDateStr}`);
    return rawDateStr;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function GreaseOilCurrent() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const cache = useCache();

  const canEdit = user && (user.role === "Supervisor" || user.role === "Mechanic");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Grease_Oil_Requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          const dataWithIndex = data.map((row, originalIndex) => ({
            ...row,
            __original_index: originalIndex,
          }));
          const pending = dataWithIndex.filter((row) => {
            const completionDate = row["Completion Date"];
            return !completionDate || completionDate.trim() === "";
          });
          setRows(pending.reverse());
        }
      } catch (err) {
        console.error("Error loading current grease/oil requests:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleEditClick = (index, row) => {
    setEditingRow(index);
    const actualRowIndex =
      row["Row Number"] !== undefined ? row["Row Number"] : (row.__original_index || 0) + 2;
    setEditData({
      rowIndex: actualRowIndex,
      Status: row["Status"] || "",
      "Handled By": row["Handled By"] || "",
      "Appointment Date": row["Appointment Date"] || "",
      "Photo After": "",
    });
  };

  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEditData((p) => ({ ...p, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveClick = async (index) => {
    if (!editData.Status) {
      alert("Please select a status.");
      return;
    }
    if (
      (editData.Status === "Completed" || editData.Status === "Rejected") &&
      !editData["Handled By"]
    ) {
      alert("For 'Completed' or 'Rejected' status, please select 'Handled By'.");
      return;
    }
    if (editData.rowIndex === undefined || editData.rowIndex === null) {
      alert("Cannot save: Row index missing. Please refresh.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        Status: editData.Status,
        "Handled By": editData["Handled By"],
        "Appointment Date": editData["Appointment Date"],
        ...(editData["Photo After"] && { "Photo After": editData["Photo After"] }),
      };

      if (["Completed", "Rejected"].includes(editData.Status)) {
        payload["Completion Date"] = new Date().toLocaleDateString("en-GB");
      }

      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/edit/Grease_Oil_Requests/${editData.rowIndex}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await res.json();

      if (result.status === "success") {
        const isDone = ["Completed", "Rejected"].includes(payload.Status);
        if (isDone) {
          setRows((r) => r.filter((_, idx) => idx !== index));
        } else {
          setRows((r) =>
            r.map((row, idx) =>
              idx === index
                ? { ...row, ...payload }
                : row
            )
          );
        }
        setEditingRow(null);
        setEditData({});
        alert("✅ Request updated successfully!");
      } else {
        alert(`❌ Error: ${result.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Network error during save.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelClick = () => {
    setEditingRow(null);
    setEditData({});
  };

  const getMechanicSupervisorOptions = () => {
    const cached = cache.getUsernames?.() || cache.usernames || [];
    return cached
      .filter((u) => ["Mechanic", "Supervisor"].includes(u.Role))
      .map((u) => u.Name || u["Full Name"] || u.Username)
      .filter(Boolean);
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: { bg: "bg-yellow-500/20", text: "text-yellow-300", icon: <AlertCircle size={14} /> },
      "In Progress": {
        bg: "bg-blue-500/20",
        text: "text-blue-300",
        icon: <Clock size={14} />,
      },
      Completed: {
        bg: "bg-green-500/20",
        text: "text-green-300",
        icon: <CheckCircle size={14} />,
      },
      Rejected: { bg: "bg-red-500/20", text: "text-red-300", icon: <XCircle size={14} /> },
    };
    const s = styles[status] || styles.Pending;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
      >
        {s.icon}
        {status || "Pending"}
      </span>
    );
  };

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <p>Loading current requests...</p>
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

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 shadow-lg shadow-amber-500/50">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Current Grease/Oil Requests
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              View and manage pending requests
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              No pending or in-progress requests found.
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
                    "Request Type",
                    "Status",
                    "Handled By",
                    "Appointment Date",
                    "Comments",
                    "Odometer Photo - Before",
                    "Odometer Photo - After",
                  ].map((h) => (
                    <th key={h} className="p-4 text-left text-sm font-semibold text-gray-300">
                      {h}
                    </th>
                  ))}
                  {canEdit && <th className="p-4 text-sm font-semibold text-gray-300">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.__original_index}
                    className={`border-t border-gray-700 hover:bg-white/5 transition ${
                      i % 2 === 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <td className="p-4 text-sm">{r["Request Date"]}</td>
                    <td className="p-4 text-sm">{r["Model / Type"]}</td>
                    <td className="p-4 text-sm">{r["Plate Number"]}</td>
                    <td className="p-4 text-sm">{r["Driver"]}</td>
                    <td className="p-4 text-sm">{r["Request Type"]}</td>
                    <td className="p-4">{getStatusBadge(r["Status"])}</td>
                    <td className="p-4 text-sm">{r["Handled By"] || "—"}</td>
                    <td className="p-4 text-sm">
                      {r["Appointment Date"]
                        ? formatAppointmentDate(r["Appointment Date"])
                        : "—"}
                    </td>
                    <td className="p-4 text-sm">{r["Comments"] || "—"}</td>
                    <td className="p-4">
                      {r["Photo Before"] ? (
                        <a
                          href={r["Photo Before"]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group block"
                        >
                          <img
                            src={getThumbnailUrl(r["Photo Before"])}
                            alt="Before"
                            className="h-16 w-16 object-cover rounded-lg border border-gray-600 group-hover:border-cyan-500 group-hover:scale-110 transition"
                          />
                          <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                            <ExternalLink className="w-6 h-6 text-cyan-400" />
                          </div>
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">No Photo</span>
                      )}
                    </td>
                    <td className="p-4">
                      {r["Photo After"] ? (
                        <a
                          href={r["Photo After"]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group block"
                        >
                          <img
                            src={getThumbnailUrl(r["Photo After"])}
                            alt="After"
                            className="h-16 w-16 object-cover rounded-lg border border-gray-600 group-hover:border-cyan-500 group-hover:scale-110 transition"
                          />
                          <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                            <ExternalLink className="w-6 h-6 text-cyan-400" />
                          </div>
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">No Photo</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="p-4">
                        {editingRow === i ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveClick(i)}
                              disabled={saving}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-green-500/30 ${
                                saving
                                  ? "bg-green-700 opacity-70 cursor-not-allowed"
                                  : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                              }`}
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelClick}
                              disabled={saving}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(i, r)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/30"
                          >
                            Edit
                          </button>
                        )}
                      </td>
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
