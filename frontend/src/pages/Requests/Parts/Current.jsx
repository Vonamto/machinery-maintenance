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
  const [loading, setLoading] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading current requests...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-cyan-400 mb-6"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-3xl font-bold mb-6">
          Current Spare Parts Requests
        </h1>

        {rows.length === 0 ? (
          <div className="text-center text-gray-400">
            No current requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800">
              <thead>
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
                      className="p-3 text-left text-sm text-gray-300"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.__rowIndex} className="border-t border-gray-700">
                    <td className="p-3">{r["Request Date"]}</td>
                    <td className="p-3">{r["Model / Type"]}</td>
                    <td className="p-3">{r["Plate Number"]}</td>
                    <td className="p-3">{r.Driver}</td>
                    <td className="p-3">{r["Requested Parts"]}</td>

                    {editingRow === i ? (
                      <>
                        <td className="p-3">
                          <select
                            value={editData.Status}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                Status: e.target.value,
                              })
                            }
                            className="bg-gray-700 p-2 rounded"
                          >
                            <option value="">Select</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>

                        <td className="p-3">
                          <select
                            value={editData["Handled By"]}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                "Handled By": e.target.value,
                              })
                            }
                            className="bg-gray-700 p-2 rounded"
                          >
                            <option value="">Select</option>
                            {mechanicSupervisorOptions.map((n) => (
                              <option key={n}>{n}</option>
                            ))}
                          </select>
                        </td>

                        <td className="p-3">
                          <textarea
                            value={editData.Comments}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                Comments: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 p-2 rounded"
                          />
                        </td>

                        <td className="p-3">
                          <div className="flex gap-2">
                            <label className="cursor-pointer">
                              <Upload size={16} />
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) =>
                                  handleFile(e.target.files?.[0])
                                }
                              />
                            </label>
                            <label className="cursor-pointer">
                              <Camera size={16} />
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                capture="environment"
                                onChange={(e) =>
                                  handleFile(e.target.files?.[0])
                                }
                              />
                            </label>
                          </div>
                        </td>

                        <td className="p-3">
                          <button
                            onClick={() => saveEdit(i)}
                            disabled={saving}
                            className="bg-green-600 px-3 py-1 rounded mr-2"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingRow(null)}
                            className="bg-gray-600 px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3">
                          {statusBadge(r.Status)}
                        </td>
                        <td className="p-3">
                          {r["Handled By"] || "—"}
                        </td>
                        <td className="p-3">
                          {r.Comments || "—"}
                        </td>
                        <td className="p-3">
                          {r["Attachment Photo"] ? (
                            <a
                              href={r["Attachment Photo"]}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={getThumbnailUrl(
                                  r["Attachment Photo"]
                                )}
                                className="h-12 w-12 object-cover rounded"
                              />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3">
                          {canEdit && (
                            <button
                              onClick={() => startEdit(i, r)}
                              className="bg-blue-600 px-3 py-1 rounded"
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
