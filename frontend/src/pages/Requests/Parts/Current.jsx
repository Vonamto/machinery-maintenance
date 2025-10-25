// frontend/src/pages/Requests/Parts/CurrentRequests.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCache } from "@/context/CacheContext"; // Import Cache Context
import CONFIG from "@/config";
import { getThumbnailUrl } from "@/utils/imageUtils"; // Import image utils

export default function PartsCurrentRequests() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [editData, setEditData] = useState({});
    const navigate = useNavigate();
    const cache = useCache(); // Get users from cache

    const canEdit = user && (user.role === "Supervisor" || user.role === "Mechanic");

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${CONFIG.BACKEND_URL}/api/Requests_Parts`, { // Fetch from Requests_Parts
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter for pending/in-progress requests (Completion Date is empty or null)
                    const pendingRequests = data.filter(row => !row["Completion Date"] || row["Completion Date"].trim() === "");
                    setRows(pendingRequests.reverse()); // Reverse for newest first
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
        setEditData({
            rowIndex: row["Row ID"], // Assuming backend sends Row ID
            Status: row["Status"] || "",
            "Handled By": row["Handled By"] || "",
            "Completion Date": row["Completion Date"] || "",
        });
    };

    const handleSaveClick = async (index) => {
        if (!editData.Status) {
            alert("Please select a status.");
            return;
        }
        if (editData.Status === "Completed" && (!editData["Handled By"] || !editData["Completion Date"])) {
            alert("For 'Completed' status, please select 'Handled By' and set 'Completion Date'.");
            return;
        }
        if (editData.Status !== "Completed" && editData["Completion Date"]) {
             // Clear completion date if status is not completed
             setEditData(prev => ({...prev, "Completion Date": ""}));
             editData["Completion Date"] = ""; // Update the local variable for the request
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const payload = { ...editData };
            // If status is Completed and Completion Date is not set, set it to now
            if (payload.Status === "Completed" && !payload["Completion Date"]) {
                payload["Completion Date"] = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            }
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/Requests_Parts/${editData.rowIndex}`, { // Use PUT endpoint
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const result = await res.json();

            if (result.status === "success") {
                // Update the local state with the edited data
                const updatedRows = [...rows];
                updatedRows[index] = { ...updatedRows[index], ...editData };
                setRows(updatedRows);
                setEditingRow(null);
                setEditData({});
                alert("Request updated successfully!");
            } else {
                alert(`Error: ${result.message || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Error saving request:", err);
            alert("An error occurred while saving.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        setEditingRow(null);
        setEditData({});
    };

    // Get mechanics and supervisors for dropdown
    const getMechanicSupervisorOptions = () => {
        if (!cache || !cache.users) {
            console.warn("Cache or users not available yet.");
            return []; // Return empty array if cache not ready
        }
        return cache.users
            .filter(u => u.Role === "Mechanic" || u.Role === "Supervisor")
            .map(u => u["Full Name"] || u.Username); // Prefer Full Name, fallback to Username
    };

    const mechanicSupervisorOptions = getMechanicSupervisorOptions();

    if (loading && rows.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-lg">Loading current requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
            <Navbar user={user} />
            <div className="p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-300 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                <h1 className="text-2xl font-bold mb-6">Current Parts Requests</h1>

                {loading ? (
                    <div className="text-center py-4">
                        <p>Updating request...</p>
                    </div>
                 ) : null}

                {rows.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400">No pending or in-progress requests found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-800/50 rounded-lg overflow-hidden">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-2">Request Date</th>
                                    <th className="p-2">Model / Type</th>
                                    <th className="p-2">Plate Number</th>
                                    <th className="p-2">Driver</th>
                                    <th className="p-2">Requested Parts</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Handled By</th>
                                    <th className="p-2">Completion Date</th>
                                    <th className="p-2">Comments</th>
                                    <th className="p-2">Photo</th>
                                    {canEdit && <th className="p-2">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i} className={i % 2 === 0 ? "bg-white/5" : "bg-transparent"}>
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
                                                        className="w-full p-1 rounded bg-gray-700 text-white"
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
                                                        className="w-full p-1 rounded bg-gray-700 text-white"
                                                        disabled={editData.Status !== "Completed"}
                                                    >
                                                        <option value="">Select Handler</option>
                                                        {mechanicSupervisorOptions.map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="date"
                                                        value={editData["Completion Date"]}
                                                        onChange={(e) => setEditData({ ...editData, "Completion Date": e.target.value })}
                                                        className="w-full p-1 rounded bg-gray-700 text-white"
                                                        disabled={editData.Status !== "Completed"}
                                                    />
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-2">{r["Status"]}</td>
                                                <td className="p-2">{r["Handled By"]}</td>
                                                <td className="p-2">{r["Completion Date"]}</td>
                                            </>
                                        )}
                                        <td className="p-2 max-w-xs truncate">{r["Comments"]}</td>
                                        <td className="p-2">
                                            {r["Attachment Photo"] ? (
                                                <a
                                                    href={r["Attachment Photo"]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="relative group block"
                                                >
                                                    <img
                                                        src={getThumbnailUrl(r["Attachment Photo"])} // Use thumbnail function
                                                        alt="Attachment"
                                                        className="h-16 w-16 object-cover rounded border border-white/20 group-hover:scale-110 transition-transform duration-150"
                                                        onError={(e) => {
                                                            e.target.style.display = "none";
                                                            e.target.nextSibling.style.display = "flex";
                                                        }}
                                                    />
                                                    <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded border border-white/20">
                                                        <ExternalLink className="w-6 h-6 text-white" />
                                                    </div>
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">No Photo</span>
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
                                                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditClick(i, r)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
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
