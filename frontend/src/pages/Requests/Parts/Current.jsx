// frontend/src/pages/Requests/Parts/Current.jsx

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Camera,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../context/AuthContext";
import { useCache } from "../../../context/CacheContext";
import CONFIG from "../../../config";

const getThumbnailUrl = (url) => {
  if (!url) return null;
  const match = url.match(/id=([^&]+)/);
  if (match) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
  }
  return url;
};

export default function PartsCurrent() {
  const { user } = useAuth();
  const cache = useCache();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const canEdit =
    user && (user.role === "Supervisor" || user.role === "Mechanic");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${CONFIG.BACKEND_URL}/api/Requests_Parts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const withIndex = data.map((r, i) => ({
            ...r,
            __rowIndex: i + 2,
          }));
          const currentOnly = withIndex.filter(
            (r) => r.Status !== "Completed"
          );
          setRows(currentOnly.reverse());
        }
      } catch (e) {
        console.error("Load Parts Current failed", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const mechanicSupervisorOptions = (cache.getUsernames?.() || [])
    .filter(
      (u) => u.Role === "Mechanic" || u.Role === "Supervisor"
    )
    .map((u) => u.Name)
    .filter(Boolean);

  const startEdit = (i, r) => {
    setEditingRow(i);
    setEditData({
      rowIndex: r.__rowIndex,
      Status: r.Status || "",
      "Handled By": r["Handled By"] || "",
      Comments: r.Comments || "",
      "Attachment Photo": "",
    });
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setEditData((p) => ({ ...p, "Attachment Photo": reader.result }));
    reader.readAsDataURL(file);
  };

  const saveEdit = async (i) => {
    if (!editData.Status) {
      alert("Please select a status.");
      return;
    }

    if (
      (editData.Status === "Completed" ||
        editData.Status === "Rejected") &&
      !editData["Handled By"]
    ) {
      alert("Handled By is required.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        Status: editData.Status,
        "Handled By": editData["Handled By"],
        Comments: editData.Comments,
        ...(editData["Attachment Photo"] && {
          "Attachment Photo": editData["Attachment Photo"],
        }),
      };

      if (
        editData.Status === "Completed" ||
        editData.Status === "Rejected"
      ) {
        payload["Completion Date"] =
          new Date().toLocaleDateString("en-GB");
      }

      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/edit/Requests_Parts/${editData.rowIndex}`,
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
        if (editData.Status === "Completed") {
          const copy = [...rows];
          copy.splice(i, 1);
          setRows(copy);
        } else {
          const copy = [...rows];
          copy[i] = {
            ...copy[i],
            ...payload,
          };
          setRows(copy);
        }
        setEditingRow(null);
        setEditData({});
        alert("Request updated successfully.");
      } else {
        alert(result.message || "Update failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (s) => {
    const map = {
      Pending: {
        c: "text-yellow-300 bg-yellow-500/20",
        i: <AlertCircle size={14} />,
      },
      "In Progress": {
        c: "text-blue-300 bg-blue-500/20",
        i: <Clock size={14} />,
      },
      Completed: {
        c: "text-green-300 bg-green-500/20",
        i: <CheckCircle size={14} />,
      },
      Rejected: {
        c: "text-red-300 bg-red-500/20",
        i: <XCircle size={14} />,
      },
    };
    const v = map[s] || map.Pending;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${v.c}`}
      >
        {v.i}
        {s || "Pending"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-lg">Loading current requests...</p>
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

        {/* ===== Title Section (Styled like Grease/Oil) ===== */}
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 shadow-lg shadow-amber-500/40">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Current Spare Parts Requests
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              View and manage pending spare parts requests
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
                    "Requested Parts",
                    "Status",
                    "Handled By",
                    "Comments",
                    "Attachment",
                    "Actions",
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
                    key={r.__rowIndex}
                    className="border-t border-gray-700 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 text-sm">{r["Request Date"]}</td>
                    <td className="p-4 text-sm">{r["Model / Type"]}</td>
                    <td className="p-4 text-sm font-mono">{r["Plate Number"]}</td>
                    <td className="p-4 text-sm">{r.Driver}</td>
                    <td className="p-4 text-sm max-w-xs truncate">
                      {r["Requested Parts"]}
                    </td>

                    {editingRow === i ? (
                      <>
                        <td className="p-4">
                          <select
                            value={editData.Status}
                            onChange={(e) =>
                              setEditData({ ...editData, Status: e.target.value })
                            }
                            className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                          >
                            <option value="">Select Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>

                        <td className="p-4">
                          <select
                            value={editData["Handled By"]}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                "Handled By": e.target.value,
                              })
                            }
                            className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                          >
                            <option value="">Select Handler</option>
                            {mechanicSupervisorOptions.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </td>

                        <td className="p-4">
                          <textarea
                            value={editData.Comments}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                Comments: e.target.value,
                              })
                            }
                            className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                          />
                        </td>

                        <td className="p-4">
                          <div className="flex gap-2">
                            <label className="cursor-pointer text-amber-400">
                              <Upload size={18} />
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => handleFile(e.target.files?.[0])}
                              />
                            </label>
                            <label className="cursor-pointer text-orange-400">
                              <Camera size={18} />
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleFile(e.target.files?.[0])}
                              />
                            </label>
                          </div>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => saveEdit(i)}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm mr-2 disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingRow(null)}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">{statusBadge(r.Status)}</td>
                        <td className="p-4 text-sm">{r["Handled By"] || "—"}</td>
                        <td className="p-4 text-sm">{r.Comments || "—"}</td>
                        <td className="p-4">
                          {r["Attachment Photo"] ? (
                            <a
                              href={r["Attachment Photo"]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group block"
                            >
                              <img
                                src={getThumbnailUrl(r["Attachment Photo"])}
                                className="h-16 w-16 object-cover rounded-lg border border-gray-600"
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
                          {canEdit && (
                            <button
                              onClick={() => startEdit(i, r)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg text-sm font-medium"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </>
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
