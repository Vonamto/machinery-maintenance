// frontend/src/pages/Requests/Parts/Current.jsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCache } from "@/context/CacheContext";
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

export default function PartsCurrentRequests() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();
  const cache = useCache();

  const canEdit =
    user && (user.role === "Supervisor" || user.role === "Mechanic");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Requests_Parts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          const dataWithIndex = data.map((row, originalIndex) => ({
            ...row,
            __original_index: originalIndex,
          }));
          // ✅ show only current requests (no completion date)
          const pendingRequests = dataWithIndex.filter((row) => {
            const completionDate = row["Completion Date"];
            return !completionDate || completionDate.trim() === "";
          });
          setRows(pendingRequests.reverse());
        }
      } catch (err) {
        console.error("Error loading current requests:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleEditClick = (index, row) => {
    setEditingRow(index);
    const actualRowIndex =
      row["Row Number"] !== undefined
        ? row["Row Number"]
        : (row.__original_index || 0) + 2;

    setEditData({
      rowIndex: actualRowIndex,
      Status: row["Status"] || "",
      "Handled By": row["Handled By"] || "",
    });
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
      alert(
        "For 'Completed' or 'Rejected' status, please select 'Handled By'."
      );
      return;
    }

    if (editData.rowIndex === undefined || editData.rowIndex === null) {
      alert("Cannot save: Row index is missing. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const updatePayload = {
        Status: editData.Status,
        "Handled By": editData["Handled By"],
      };

      // ✅ Auto-fill Completion Date if status is Completed or Rejected
      if (
        editData.Status === "Completed" ||
        editData.Status === "Rejected"
      ) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString("en-GB"); // DD/MM/YYYY
        updatePayload["Completion Date"] = formattedDate;
      }

      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/edit/Requests_Parts/${editData.rowIndex}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatePayload),
        }
      );
      const result = await res.json();

      if (result.status === "success") {
        const isNoLongerCurrent =
          updatePayload.Status === "Completed" ||
          updatePayload.Status === "Rejected";

        if (isNoLongerCurrent) {
          const updatedRows = [...rows];
          updatedRows.splice(index, 1);
          setRows(updatedRows);
        } else {
          const updatedRows = [...rows];
          updatedRows[index] = {
            ...updatedRows[index],
            Status: updatePayload.Status,
            "Handled By": updatePayload["Handled By"],
          };
          setRows(updatedRows);
        }

        setEditingRow(null);
        setEditData({});
        alert("Request updated successfully!");
      } else {
        alert(`Error: ${result.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error saving request:", err);
      alert("An error occurred while saving. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setEditingRow(null);
    setEditData({});
  };

  const getMechanicSupervisorOptions = () => {
    const cachedUsernames =
      cache.getUsernames?.() || cache.usernames || [];
    if (!Array.isArray(cachedUsernames)) return [];
    return cachedUsernames
      .filter((u) => u.Role === "Mechanic" || u.Role === "Supervisor")
      .map((u) => u.Name || u["Full Name"] || u.Username)
      .filter(Boolean);
  };

  const mechanicSupervisorOptions = getMechanicSupervisorOptions();

  const getStatusBadge = (status) => {
    const styles = {
      Pending: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-300",
        icon: <AlertCircle size={14} />,
      },
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
      Rejected: {
        bg: "bg-red-500/20",
        text: "text-red-300",
        icon: <XCircle size={14} />,
      },
    };
    const style = styles[status] || styles["Pending"];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {style.icon}
        {status || "Pending"}
      </span>
    );
  };

  if (loading && rows.length === 0) {
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
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 shadow-lg shadow-amber-500/50">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Current Parts Requests
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
                    "Requested Parts",
                    "Status",
                    "Handled By",
                    "Comments",
                    "Photo",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-4 text-left text-sm font-semibold text-gray-300"
                    >
                      {h}
                    </th>
                  ))}
                  {canEdit && (
                    <th className="p-4 text-left text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.__original_index}
                    className={`border-t border-gray-700 hover:bg-white/5 transition-colors ${
                      i % 2 === 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <td className="p-4 text-sm">{r["Request Date"]}</td>
                    <td className="p-4 text-sm">{r["Model / Type"]}</td>
                    <td className="p-4 text-sm font-mono">
                      {r["Plate Number"]}
                    </td>
                    <td className="p-4 text-sm">{r["Driver"]}</td>
                    <td className="p-4 text-sm max-w-xs truncate">
                      {r["Requested Parts"]}
                    </td>
                    {editingRow === i ? (
                      <>
                        <td className="p-4">
                          <select
                            value={editData.Status}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                Status: e.target.value,
                              })
                            }
                            className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
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
                            className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                          >
                            <option value="">Select Handler</option>
                            {mechanicSupervisorOptions.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">{getStatusBadge(r["Status"])}</td>
                        <td className="p-4 text-sm">
                          {r["Handled By"] || (
                            <span className="text-gray-500">Unassigned</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="p-4 text-sm max-w-xs truncate">
                      {r["Comments"] || (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
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
                            alt="Attachment"
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
                    {canEdit && (
                      <td className="p-4">
                        {editingRow === i ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveClick(i)}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-sm font-medium transition-all shadow-lg shadow-green-500/30"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelClick}
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
