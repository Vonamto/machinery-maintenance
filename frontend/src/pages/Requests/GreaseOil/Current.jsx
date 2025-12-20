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
import Navbar from "../../../components/Navbar"; // Adjusted path
import { useAuth } from "../../../context/AuthContext"; // Adjusted path
import { useNavigate } from "react-router-dom"; // Adjusted path
import { useCache } from "../../../context/CacheContext"; // Adjusted path
import CONFIG from "../../../config"; // Adjusted path
import { useTranslation } from "react-i18next"; // Added hook

const getThumbnailUrl = (url) => {
  if (!url) return null;
  const match = url.match(/id=([^&]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  }
  return url;
};

// Helper function to format the Appointment Date
const formatAppointmentDate = (rawDateStr) => {
  if (!rawDateStr) return rawDateStr;

  const date = new Date(rawDateStr);
  if (isNaN(date.getTime())) {
    console.warn(`Could not parse Appointment Date: ${rawDateStr}`);
    return rawDateStr;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function GreaseOilCurrent() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false); // ✅ Added saving state
  const navigate = useNavigate();
  const cache = useCache();
  const { t } = useTranslation(); // Added translation hook

  const canEdit =
    user && (user.role === "Supervisor" || user.role === "Mechanic");

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
          const pendingRequests = dataWithIndex.filter((row) => {
            const completionDate = row["Completion Date"];
            return !completionDate || completionDate.trim() === "";
          });
          setRows(pendingRequests.reverse());
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
      row["Row Number"] !== undefined
        ? row["Row Number"]
        : (row.__original_index || 0) + 2;

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
    reader.onloadend = () => setEditData(prev => ({ ...prev, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveClick = async (index) => {
    if (!editData.Status) {
      alert(t("requests.grease.current.alerts.missingStatus"));
      return;
    }
    if (
      (editData.Status === "Completed" || editData.Status === "Rejected") &&
      !editData["Handled By"]
    ) {
      alert(
        t("requests.grease.current.alerts.missingHandler")
      );
      return;
    }

    if (editData.rowIndex === undefined || editData.rowIndex === null) {
      alert(t("requests.grease.current.alerts.missingRowIndex"));
      return;
    }

    setSaving(true); // ✅ start saving
    try {
      const token = localStorage.getItem("token");
      const updatePayload = {
        Status: editData.Status,
        "Handled By": editData["Handled By"],
        "Appointment Date": editData["Appointment Date"],
        ...(editData["Photo After"] && { "Photo After": editData["Photo After"] }),
      };

      if (editData.Status === "Completed" || editData.Status === "Rejected") {
        const today = new Date();
        const formattedDate = today.toLocaleDateString("en-GB");
        updatePayload["Completion Date"] = formattedDate;
      }

      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/edit/Grease_Oil_Requests/${editData.rowIndex}`,
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
            "Appointment Date": updatePayload["Appointment Date"],
            ...(updatePayload["Photo After"] && { "Photo After": updatePayload["Photo After"] }),
          };
          setRows(updatedRows);
        }

        setEditingRow(null);
        setEditData({});
        alert(t("requests.grease.current.alerts.updateSuccess"));
      } else {
        alert(t("requests.grease.current.alerts.updateError", { message: result.message || "Unknown error" }));
      }
    } catch (err) {
      console.error("Error saving grease/oil request:", err);
      alert(t("requests.grease.current.alerts.saveError"));
    } finally {
      setSaving(false); // ✅ stop saving
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
          <p className="text-lg">{t("requests.grease.current.loading")}</p>
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
          {t("common.back")}
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 shadow-lg shadow-amber-500/50">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              {t("requests.grease.current.title")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {t("requests.grease.current.subtitle")}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {t("requests.grease.current.empty")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700 shadow-2xl">
            <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                <tr>
                  {[
                    t("requests.grease.current.table.requestDate"),
                    t("requests.grease.current.table.model"),
                    t("requests.grease.current.table.plate"),
                    t("requests.grease.current.table.driver"),
                    t("requests.grease.current.table.requestType"),
                    t("requests.grease.current.table.status"),
                    t("requests.grease.current.table.handledBy"),
                    t("requests.grease.current.table.appointmentDate"),
                    t("requests.grease.current.table.comments"),
                    t("requests.grease.current.table.photoBefore"),
                    t("requests.grease.current.table.photoAfter"),
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
                      {t("requests.grease.current.table.actions")}
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
                    <td className="p-4 text-sm font-mono">{r["Plate Number"]}</td>
                    <td className="p-4 text-sm">{r["Driver"]}</td>
                    <td className="p-4 text-sm max-w-xs truncate">{r["Request Type"]}</td>
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
                            <option value="">{t("requests.grease.current.selectStatus")}</option>
                            <option value="Pending">{t("status.Pending")}</option>
                            <option value="In Progress">{t("status.In Progress")}</option>
                            <option value="Completed">{t("status.Completed")}</option>
                            <option value="Rejected">{t("status.Rejected")}</option>
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
                            <option value="">{t("requests.grease.current.selectHandler")}</option>
                            {mechanicSupervisorOptions.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          <input
                            type="datetime-local"
                            value={editData["Appointment Date"]}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                "Appointment Date": e.target.value,
                              })
                            }
                            className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">{getStatusBadge(r["Status"])}</td>
                        <td className="p-4 text-sm">
                          {r["Handled By"] || <span className="text-gray-500">{t("common.no")}</span>}
                        </td>
                        <td className="p-4 text-sm">
                          {r["Appointment Date"] ? formatAppointmentDate(r["Appointment Date"]) : <span className="text-gray-500">—</span>}
                        </td>
                      </>
                    )}
                    <td className="p-4 text-sm max-w-xs truncate">{r["Comments"] || <span className="text-gray-500">—</span>}</td>
                    <td className="p-4">
                      {r["Photo Before"] ? (
                        <a href={r["Photo Before"]} target="_blank" rel="noopener noreferrer" className="relative group block">
                          <img src={getThumbnailUrl(r["Photo Before"])} alt={t("requests.grease.current.table.photoBefore")} className="h-16 w-16 object-cover rounded-lg border border-gray-600 group-hover:border-cyan-500 group-hover:scale-110 transition-all duration-200 shadow-lg"/>
                          <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                            <ExternalLink className="w-6 h-6 text-cyan-400" />
                          </div>
                        </a>
                      ) : <span className="text-gray-500 text-sm">{t("requests.grease.current.noPhoto")}</span>}
                    </td>
                    <td className="p-4">
                      {editingRow === i ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <label className="flex-1 flex items-center justify-center gap-1 cursor-pointer bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-2 py-1 rounded-lg transition-all text-xs">
                              <Upload size={14} />
                              <span>{t("common.upload")}</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], "Photo After")} />
                            </label>
                            <label className="flex-1 flex items-center justify-center gap-1 cursor-pointer bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-2 py-1 rounded-lg transition-all text-xs">
                              <Camera size={14} />
                              <span>{t("common.camera")}</span>
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], "Photo After")} />
                            </label>
                          </div>
                          {editData["Photo After"] && (
                            <img src={editData["Photo After"]} alt={t("requests.grease.current.table.photoAfter")} className="h-16 w-16 object-cover rounded-lg border border-gray-600 mx-auto"/>
                          )}
                        </div>
                      ) : r["Photo After"] ? (
                        <a href={r["Photo After"]} target="_blank" rel="noopener noreferrer" className="relative group block">
                          <img src={getThumbnailUrl(r["Photo After"])} alt={t("requests.grease.current.table.photoAfter")} className="h-16 w-16 object-cover rounded-lg border border-gray-600 group-hover:border-cyan-500 group-hover:scale-110 transition-all duration-200 shadow-lg"/>
                          <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                            <ExternalLink className="w-6 h-6 text-cyan-400" />
                          </div>
                        </a>
                      ) : <span className="text-gray-500 text-sm">{t("requests.grease.current.noPhoto")}</span>}
                    </td>
                    {canEdit && (
                      <td className="p-4">
                        {editingRow === i ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveClick(i)}
                              disabled={saving}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-sm font-medium transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? t("requests.grease.current.saving") : t("requests.grease.current.save")}
                            </button>
                            <button
                              onClick={handleCancelClick}
                              disabled={saving}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {t("requests.grease.current.cancel")}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(i, r)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/30"
                          >
                            {t("requests.grease.current.edit")}
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
