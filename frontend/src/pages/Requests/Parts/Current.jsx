// frontend/src/pages/Requests/Parts/CurrentRequests.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar"; // Import Navbar for consistent styling
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
                    // Filter for pending/in-progress requests (Completion Date is empty, null, or whitespace)
                    const pendingRequests = data.filter(row => {
                        const completionDate = row["Completion Date"];
                        // Check for null, undefined, empty string, or just whitespace
                        return !completionDate || completionDate.trim() === "";
                    });
                    // Add an internal index for React keying and editing state, assuming data comes with original row numbers
                    // The backend likely sends the actual row number in the Google Sheet (e.g., 2 for the first data row after headers)
                    // We need to extract the 'Row Number' from the backend response if available.
                    setRows(pendingRequests.reverse().map((row, index) => ({...row, __internal_index: index})));
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
        // Use the actual row index from the backend response (assuming it's sent as 'Row Number' or similar)
        // The backend blueprint shows the PUT endpoint expecting the row number: /api/edit/<sheet_name>/<int:row_index>
        // Ensure the backend response includes the sheet row number as 'Row Number' or a similar field.
        setEditData({
            rowIndex: row["Row Number"], // Assuming backend sends the actual sheet row number as 'Row Number'
            Status: row["Status"] || "",
            "Handled By": row["Handled By"] || "",
            // Do not store Completion Date in editData for this view
        });
    };

    const handleSaveClick = async (index) => {
        if (!editData.Status) {
            alert("Please select a status.");
            return;
        }
        // Check if status is Completed and Handled By is missing (Completion Date will be auto-filled by backend)
        if (editData.Status === "Completed" && !editData["Handled By"]) {
            alert("For 'Completed' status, please select 'Handled By'. Completion Date will be auto-filled.");
            return; // Don't proceed with save
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            // Prepare payload - only send Status and Handled By
            // Backend handles Completion Date auto-fill on "Completed" status
            const updatePayload = {
                Status: editData.Status,
                "Handled By": editData["Handled By"],
                // Do not include Completion Date in the payload for this view
            };
            // Correct API endpoint for editing a specific row
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/edit/Requests_Parts/${editData.rowIndex}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatePayload),
            });
            const result = await res.json();

            if (result.status === "success") {
                // Update the local state with the edited data
                const updatedRows = [...rows];
                // Update the specific row in the state with new values
                // The Completion Date will be updated by the backend and reflected on page reload or refetch
                updatedRows[index] = {
                    ...updatedRows[index],
                    "Status": updatePayload.Status,
                    "Handled By": updatePayload["Handled By"]
                    // Do not update Completion Date here as it might not be in the response yet
                    // Or, if backend returns the updated row, update it accordingly
                    // For now, assume state update happens correctly without Completion Date
                };
                setRows(updatedRows);
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

    // Get mechanics and supervisors for dropdown - Updated to use correct cache key and handle potential naming differences
    // Based on blueprint and other components like MaintenanceForm
    const getMechanicSupervisorOptions = () => {
        // Check the cache structure - it might be cache.usernames or cache.getUsernames()
        const cachedUsernames = cache.getUsernames ? cache.getUsernames() : cache.usernames || [];
        if (!Array.isArray(cachedUsernames)) {
            console.warn("Cache or usernames not available or not an array yet.");
            return []; // Return empty array if cache not ready
        }
        // Filter and map based on Role property
        return cachedUsernames
            .filter(u => u.Role === "Mechanic" || u.Role === "Supervisor")
            .map(u => u.Name || u["Full Name"] || u.Username) // Try Name, then Full Name, then Username
            .filter(Boolean); // Remove any undefined/falsy names
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
                {/* Back button using Navbar's styling approach */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-blue-500 hover:text-blue-400 mb-6 transition-colors" // Changed text color to blue
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                {/* Submenu title with consistent styling */}
                <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Current Parts Requests</h3>

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
                                    {/* Removed Completion Date column header */}
                                    <th className="p-2">Comments</th>
                                    <th className="p-2">Photo</th>
                                    {canEdit && <th className="p-2">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={r.__internal_index} className={i % 2 === 0 ? "bg-white/5" : "bg-transparent"}>
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
                                                    >
                                                        <option value="">Select Handler</option>
                                                        {mechanicSupervisorOptions.map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                {/* Completion Date input is completely removed from the edit row */}
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-2">{r["Status"]}</td>
                                                <td className="p-2">{r["Handled By"]}</td>
                                                {/* Completion Date column is hidden in view mode as well */}
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
