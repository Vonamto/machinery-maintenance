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
                    // The backend likely sends the actual row number as an identifier if configured correctly
                    setRows(pendingRequests.reverse().map((row, index) => ({...row, __internal_index: index}))); // Add internal index
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
        // Use the actual row index from the backend response (assuming it's sent as 'Row ID' or similar)
        // If the backend doesn't send the sheet row number, we might need to rely on the internal index + header offset
        // Let's assume backend sends 'Row Number' field representing the actual sheet row (e.g., 2 for first data row)
        // If not, we might need to change backend to send it or use a different approach.
        // For now, let's try using the internal index and see if backend handles it correctly.
        // If backend expects the sheet row number, we need to get it from the original data fetch.
        // Modify the fetch to include the sheet row number somehow.
        // Let's assume backend sends the sheet row number as 'Row Number' in the response object.
        // If backend doesn't send it, we cannot update correctly. We need the *actual* row number in the sheet.
        // This is crucial. Let's assume backend correctly sends 'Row Number' field.
        // Adjusted for internal index mapping:
        setEditData({
            rowIndex: row["Row Number"], // Assuming backend sends the actual sheet row number as 'Row Number'
            Status: row["Status"] || "",
            "Handled By": row["Handled By"] || "",
            "Completion Date": row["Completion Date"] || "", // Store original date if any, but don't show input unless status is Completed
        });
    };

    const handleSaveClick = async (index) => {
        if (!editData.Status) {
            alert("Please select a status.");
            return;
        }
        // Check if status is Completed and required fields are missing
        if (editData.Status === "Completed" && (!editData["Handled By"] || !editData["Completion Date"])) {
            alert("For 'Completed' status, please select 'Handled By' and ensure 'Completion Date' is set.");
            return; // Don't proceed with save
        }
        // If status is not completed, ensure Completion Date is cleared in the payload
        let payload = { ...editData };
        if (editData.Status !== "Completed") {
             payload["Completion Date"] = ""; // Clear date if not completed
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            // If status is Completed and Completion Date is not set in editData (meaning user didn't pick one),
            // we need to set it to today's date *before* sending to backend, or let backend handle it.
            // The backend already has logic to auto-fill date on "Completed".
            // If we send an empty date for "Completed", backend should fill it.
            // If we send a specific date, backend should use that.
            // So, the payload as is should be fine, relying on backend logic.
            // Ensure we only send the fields we intend to update.
            const updatePayload = {
                Status: payload.Status,
                "Handled By": payload["Handled By"],
                "Completion Date": payload["Completion Date"] // Send the date (empty if not completed, or filled if completed)
            };
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/Requests_Parts/${editData.rowIndex}`, { // Use PUT endpoint
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
                updatedRows[index] = {
                    ...updatedRows[index],
                    "Status": updatePayload.Status,
                    "Handled By": updatePayload["Handled By"],
                    "Completion Date": updatePayload["Completion Date"] // Update the date in state
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

    // Get mechanics and supervisors for dropdown - Updated to handle potential naming differences
    const getMechanicSupervisorOptions = () => {
        if (!cache || !cache.users || !Array.isArray(cache.users)) {
            console.warn("Cache or users not available or not an array yet.");
            return []; // Return empty array if cache not ready
        }
        // Try different common field names for the user's display name
        return cache.users
            .filter(u => u.Role === "Mechanic" || u.Role === "Supervisor")
            .map(u => u["Full Name"] || u["Name"] || u.Username) // Try Full Name, then Name, then Username
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
                                    {/* Hidden Completion Date column header for layout if needed, or remove entirely */}
                                    <th className="p-2">Completion Date</th> {/* Keep if needed for layout, remove if not */}
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
                                                {/* Hide Completion Date input unless status is Completed */}
                                                <td className="p-2">
                                                    {editData.Status === "Completed" ? (
                                                        <input
                                                            type="date"
                                                            value={editData["Completion Date"]}
                                                            onChange={(e) => setEditData({ ...editData, "Completion Date": e.target.value })}
                                                            className="w-full p-1 rounded bg-gray-700 text-white"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-500">Auto when Completed</span>
                                                    )}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-2">{r["Status"]}</td>
                                                <td className="p-2">{r["Handled By"]}</td>
                                                <td className="p-2">{r["Completion Date"]}</td> {/* Show current date if any */}
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
