// frontend/src/pages/Requests/Parts/Current.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCache } from "@/context/CacheContext";
import CONFIG from "@/config";

// Helper function for thumbnails
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

    const canEdit = user && (user.role === "Supervisor" || user.role === "Mechanic");

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
                        __original_index: originalIndex
                    }));
                    const pendingRequests = dataWithIndex.filter(row => {
                        const completionDate = row["Completion Date"];
                        return !completionDate || completionDate.trim() === "";
                    });
                    const reversedPending = pendingRequests.reverse();
                    setRows(reversedPending);
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
        console.log("Debug: Row object received by handleEditClick:", row);
        setEditingRow(index);
        let actualRowIndex;
        if (row["Row Number"] !== undefined) {
            actualRowIndex = row["Row Number"];
            console.log("Using backend-provided Row Number:", actualRowIndex);
        } else {
            actualRowIndex = (row.__original_index || 0) + 2;
            console.log("Calculated Row Number (original index + 2):", actualRowIndex, "from __original_index:", row.__original_index);
        }

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
        if (editData.Status === "Completed" && !editData["Handled By"]) {
            alert("For 'Completed' status, please select 'Handled By'. Completion Date will be auto-filled.");
            return;
        }

        if (editData.rowIndex === undefined || editData.rowIndex === null) {
             console.error("Cannot save: rowIndex is undefined or null.", editData);
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
            console.log("Attempting PUT request to:", `${CONFIG.BACKEND_URL}/api/edit/Requests_Parts/${editData.rowIndex}`);
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/edit/Requests_Parts/${editData.rowIndex}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatePayload),
            });
            console.log("Response status:", res.status);
            const result = await res.json();
            console.log("Response body:", result);

            if (result.status === "success") {
                const isNoLongerCurrent = updatePayload.Status === "Completed" || updatePayload.Status === "Rejected";

                if (isNoLongerCurrent) {
                    const updatedRows = [...rows];
                    updatedRows.splice(index, 1);
                    setRows(updatedRows);
                    console.log("Row removed from view as status changed to non-current:", updatePayload.Status);
                } else {
                    const updatedRows = [...rows];
                    updatedRows[index] = {
                        ...updatedRows[index],
                        "Status": updatePayload.Status,
                        "Handled By": updatePayload["Handled By"]
                    };
                    setRows(updatedRows);
                    console.log("Row updated in view with new status/data.");
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
        const cachedUsernames = cache.getUsernames ? cache.getUsernames() : cache.usernames || [];
        if (!Array.isArray(cachedUsernames)) {
            console.warn("Cache or usernames not available or not an array yet.");
            return [];
        }
        return cachedUsernames
            .filter(u => u.Role === "Mechanic" || u.Role === "Supervisor")
            .map(u => u.Name || u["Full Name"] || u.Username)
            .filter(Boolean);
    };

    const mechanicSupervisorOptions = getMechanicSupervisorOptions();

    if (loading && rows.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-theme-background-primary via-theme-background-secondary to-theme-background text-theme-text flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary-500 mb-4"></div>
                    <p className="text-lg">Loading current requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-theme-background-primary via-theme-background-secondary to-theme-background text-theme-text">
            <Navbar user={user} />
            <div className="p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-theme-primary-500 hover:text-theme-primary-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-theme-accent-400 to-orange-500">Current Parts Requests</h3>

                {loading ? (
                    <div className="text-center py-4">
                        <p>Updating request...</p>
                    </div>
                 ) : null}

                {rows.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-theme-text-secondary">No pending or in-progress requests found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-theme-background-card rounded-lg overflow-hidden">
                            <thead className="bg-theme-background-secondary">
                                <tr>
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
                                {rows.map((r, i) => (
                                    <tr key={r.__original_index} className={i % 2 === 0 ? "bg-white/5" : "bg-transparent"}>
                                        <td className="p-2">{r["Request Date"]}</td>
                                        <td className="p-2">{r["Model / Type"]}</td>
                                        <td className="p-2">{r["Plate Number"]}</td>
                                        <td className="p-2">{r["Driver"]}</td>
                                        <td className="p-2">{r["Requested Parts"]}</td>
                                        {editingRow === i ? (
                                            <>
                                                <td className="p-2">
                                                    <select
                                                        value={editData.Status}
                                                        onChange={(e) => setEditData({ ...editData, Status: e.target.value })}
                                                        className="w-full p-1 rounded bg-theme-background-secondary border border-theme-border text-theme-text"
                                                    >
                                                        <option value="">Select Status</option>
                                                        <option value="Pending">Pending</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <select
                                                        value={editData["Handled By"]}
                                                        onChange={(e) => setEditData({ ...editData, "Handled By": e.target.value })}
                                                        className="w-full p-1 rounded bg-theme-background-secondary border border-theme-border text-theme-text"
                                                    >
                                                        <option value="">Select Handler</option>
                                                        {mechanicSupervisorOptions.map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-2">{r["Status"]}</td>
                                                <td className="p-2">{r["Handled By"]}</td>
                                            </>
                                        )}
                                        <td className="p-2 max-w-xs truncate">{r["Comments"]}</td>
                                        <td className="p-2">
                                            {r["Attachment Photo"] ? (
                                                
                                                    href={r["Attachment Photo"]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="relative group block"
                                                >
                                                    <img
                                                        src={getThumbnailUrl(r["Attachment Photo"])}
                                                        alt="Attachment"
                                                        className="h-16 w-16 object-cover rounded border border-theme-border group-hover:scale-110 transition-transform duration-150"
                                                        onError={(e) => {
                                                            e.target.style.display = "none";
                                                            e.target.nextSibling.style.display = "flex";
                                                        }}
                                                    />
                                                    <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded border border-theme-border">
                                                        <ExternalLink className="w-6 h-6 text-theme-text" />
                                                    </div>
                                                </a>
                                            ) : (
                                                <span className="text-theme-text-muted">No Photo</span>
                                            )}
                                        </td>
                                        {canEdit && (
                                            <td className="p-2">
                                                {editingRow === i ? (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleSaveClick(i)}
                                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={handleCancelClick}
                                                            className="px-3 py-1 bg-theme-background-secondary hover:bg-theme-background-surface rounded text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditClick(i, r)}
                                                        className="px-3 py-1 bg-theme-primary-600 hover:bg-theme-primary-700 rounded text-sm"
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
