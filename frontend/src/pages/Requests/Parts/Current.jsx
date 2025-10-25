// frontend/src/pages/Requests/Parts/Current.jsx (or CurrentRequests.jsx)
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
                    // Calculate the original index for each row before filtering
                    const dataWithIndex = data.map((row, originalIndex) => ({
                        ...row,
                        __original_index: originalIndex // Add the original index (0-based)
                    }));
                    // Filter for pending/in-progress requests (Completion Date is empty, null, or whitespace)
                    const pendingRequests = dataWithIndex.filter(row => {
                        const completionDate = row["Completion Date"];
                        // Check for null, undefined, empty string, or just whitespace
                        return !completionDate || completionDate.trim() === "";
                    });
                    // Reverse for newest first *after* filtering
                    const reversedPending = pendingRequests.reverse();
                    // Calculate the correct sheet row number for each item in the reversed list
                    // The first data row in the sheet is assumed to be row 2.
                    // So, if the original data list had N items [0..N-1], corresponding to sheet rows [2..N+1],
                    // and we have a filtered/reversed list of length F, the item at index i in this list
                    // originally came from the raw data at some index orig_i.
                    // To find the *sheet row number*, we use the original index: orig_i + 2.
                    // Since we reversed the *filtered* list, the item at reversed_list[i] was originally at
                    // the end of the filtered list compared to its original position in the raw data.
                    // We need to map the index 'i' in the reversed list back to its original index in the raw data list.
                    // This is complex without a direct map. Let's assume the backend sends 'Row Number' correctly.
                    // If not, we'll use the calculated original index.
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
        console.log("Debug: Row object received by handleEditClick:", row); // Log the row object
        setEditingRow(index);
        // Try to get the Row Number from the backend response
        // If it's not present, calculate it based on the original index stored earlier
        let actualRowIndex;
        if (row["Row Number"] !== undefined) {
            actualRowIndex = row["Row Number"]; // Use the backend-provided number
            console.log("Using backend-provided Row Number:", actualRowIndex);
        } else {
            // Calculate: original index (from raw data) + 2 (assuming first data row is 2)
            actualRowIndex = (row.__original_index || 0) + 2;
            console.log("Calculated Row Number (original index + 2):", actualRowIndex, "from __original_index:", row.__original_index);
        }

        setEditData({
            rowIndex: actualRowIndex, // Use the determined row index
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
        if (editData.Status === "Completed" && !editData["Handled By"]) {
            alert("For 'Completed' status, please select 'Handled By'. Completion Date will be auto-filled.");
            return; // Don't proceed with save
        }

        if (editData.rowIndex === undefined || editData.rowIndex === null) {
             console.error("Cannot save: rowIndex is undefined or null.", editData);
             alert("Cannot save: Row index is missing. Please refresh the page.");
             return;
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
            console.log("Attempting PUT request to:", `${CONFIG.BACKEND_URL}/api/edit/Requests_Parts/${editData.rowIndex}`); // Log the URL
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/edit/Requests_Parts/${editData.rowIndex}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatePayload),
            });
            console.log("Response status:", res.status); // Log status
            const result = await res.json();
            console.log("Response body:", result); // Log response body

            if (result.status === "success") {
                // --- AUTO-REMOVE LOGIC BEGINS ---
                // Determine if the updated status makes the row no longer "current"
                const isNoLongerCurrent = updatePayload.Status === "Completed" || updatePayload.Status === "Rejected";

                if (isNoLongerCurrent) {
                    // Remove the row from the local state array
                    const updatedRows = [...rows];
                    updatedRows.splice(index, 1); // Remove the item at the current index
                    setRows(updatedRows);
                    console.log("Row removed from view as status changed to non-current:", updatePayload.Status);
                } else {
                    // If status is still current (Pending, In Progress), update the specific row in the state
                    const updatedRows = [...rows];
                    // Update the specific row in the state with new values
                    updatedRows[index] = {
                        ...updatedRows[index],
                        "Status": updatePayload.Status,
                        "Handled By": updatePayload["Handled By"]
                        // Do not update Completion Date here as it might not be in the response yet
                    };
                    setRows(updatedRows);
                    console.log("Row updated in view with new status/data.");
                }
                // --- AUTO-REMOVE LOGIC ENDS ---

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
            // Apply main theme background and text color
            <div className="min-h-screen bg-theme-background-primary text-theme-text-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary-500 mb-4"></div>
                    <p className="text-lg">Loading current requests...</p>
                </div>
            </div>
        );
    }

    return (
        // Apply main theme background and text color
        <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
            <Navbar user={user} />
            <div className="p-6">
                {/* Back button - Apply theme color */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-theme-primary-500 hover:text-theme-primary-400 mb-6 transition-colors" // Changed text color to theme primary
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
                        <p className="text-theme-text-muted">No pending or in-progress requests found.</p> {/* Apply theme color */}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Apply theme colors for table container */}
                        <table className="min-w-full bg-theme-background-secondary/50 rounded-lg overflow-hidden">
                            {/* Apply theme color for table header */}
                            <thead className="bg-theme-background-secondary">
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
                                    <tr key={r.__original_index} className={i % 2 === 0 ? "bg-theme-background-surface" : "bg-theme-background-secondary/30"}> {/* Use original index for key if available, apply alternating theme colors */}
                                        <td className="p-2">{r["Request Date"]}</td>
                                        <td className="p-2">{r["Model / Type"]}</td>
                                        <td className="p-2">{r["Plate Number"]}</td>
                                        <td className="p-2">{r["Driver"]}</td>
                                        <td className="p-2">{r["Requested Parts"]}</td>
                                        {editingRow === i ? (
                                            <>
                                                <td className="p-2">
                                                    {/* Apply theme colors for edit select */}
                                                    <select
                                                        value={editData.Status}
                                                        onChange={(e) => setEditData({ ...editData, Status: e.target.value })}
                                                        className="w-full p-1 rounded bg-theme-background-secondary text-theme-text-primary"
                                                    >
                                                        <option value="">Select Status</option>
                                                        <option value="Pending">Pending</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    {/* Apply theme colors for edit select */}
                                                    <select
                                                        value={editData["Handled By"]}
                                                        onChange={(e) => setEditData({ ...editData, "Handled By": e.target.value })}
                                                        className="w-full p-1 rounded bg-theme-background-secondary text-theme-text-primary"
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
                                                    {/* Apply theme border color to photo */}
                                                    <img
                                                        src={getThumbnailUrl(r["Attachment Photo"])} // Use thumbnail function
                                                        alt="Attachment"
                                                        className="h-16 w-16 object-cover rounded border border-theme-border-light group-hover:scale-110 transition-transform duration-150"
                                                        onError={(e) => {
                                                            e.target.style.display = "none";
                                                            e.target.nextSibling.style.display = "flex";
                                                        }}
                                                    />
                                                    <div className="hidden group-hover:flex absolute inset-0 bg-theme-background-secondary/70 items-center justify-center rounded border border-theme-border-light">
                                                        <ExternalLink className="w-6 h-6 text-theme-primary-400" /> {/* Apply theme color for icon */}
                                                    </div>
                                                </a>
                                            ) : (
                                                <span className="text-theme-text-muted">No Photo</span> {/* Apply theme color */}
                                            )}
                                        </td>
                                        {canEdit && (
                                            <td className="p-2">
                                                {editingRow === i ? (
                                                    <div className="flex space-x-2">
                                                        {/* Apply theme colors for Save button */}
                                                        <button
                                                            onClick={() => handleSaveClick(i)}
                                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-theme-text-primary"
                                                        >
                                                            Save
                                                        </button>
                                                        {/* Apply theme colors for Cancel button */}
                                                        <button
                                                            onClick={handleCancelClick}
                                                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm text-theme-text-primary"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    {/* Apply theme colors for Edit button */}
                                                    <button
                                                        onClick={() => handleEditClick(i, r)}
                                                        className="px-3 py-1 bg-theme-primary-600 hover:bg-theme-primary-700 rounded text-sm text-theme-text-primary"
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
