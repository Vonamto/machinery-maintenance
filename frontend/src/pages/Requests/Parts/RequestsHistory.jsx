// frontend/src/pages/Requests/Parts/RequestsHistory.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";
import { getThumbnailUrl } from "@/utils/imageUtils"; // Import image utils

export default function PartsRequestsHistory() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Note: Assuming role-based access is handled by the navigation/submenu structure.
    // Backend API should still enforce permissions.

    useEffect(() => {
        // Load history data regardless of specific frontend role check here,
        // relying on backend to filter results based on user permissions.
        async function load() {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${CONFIG.BACKEND_URL}/api/Requests_Parts`, { // Fetch from Requests_Parts
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter for completed/rejected requests (Completion Date is not empty/null/whitespace)
                    // and Status is "Completed" or "Rejected"
                    const historyRequests = data.filter(row => {
                        const completionDate = row["Completion Date"];
                        const status = row["Status"];
                        // Check for Completion Date presence AND Status being Completed or Rejected
                        return completionDate && completionDate.trim() !== "" && (status === "Completed" || status === "Rejected");
                    });
                    setRows(historyRequests.reverse()); // Reverse for newest first
                }
            } catch (err) {
                console.error("Error loading requests history:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []); // Removed dependency on canView as it's no longer used

    if (loading && rows.length === 0) {
        return (
            // Apply main theme background and text color
            <div className="min-h-screen bg-theme-background-primary text-theme-text-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary-500 mb-4"></div>
                    <p className="text-lg">Loading requests history...</p>
                </div>
            </div>
        );
    }

    return (
        // Apply main theme background and text color
        <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
            <Navbar user={user} />
            <div className="p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-theme-primary-500 hover:text-theme-primary-400 mb-6 transition-colors" // Apply theme color
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Parts Requests History</h3>

                {loading ? (
                    <div className="text-center py-4">
                        <p>Loading history...</p>
                    </div>
                 ) : null}

                {rows.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-theme-text-muted">No completed or rejected requests found.</p> {/* Apply theme color */}
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
                                    <th className="p-2">Completion Date</th>
                                    <th className="p-2">Comments</th>
                                    <th className="p-2">Photo</th>
                                    {/* No Actions column for history view */}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    // Apply alternating row colors using theme colors
                                    <tr key={r.__original_index || i} className={i % 2 === 0 ? "bg-theme-background-surface" : "bg-theme-background-secondary/30"}> {/* Use original index if available, else 'i' */}
                                        <td className="p-2">{r["Request Date"]}</td>
                                        <td className="p-2">{r["Model / Type"]}</td>
                                        <td className="p-2">{r["Plate Number"]}</td>
                                        <td className="p-2">{r["Driver"]}</td>
                                        <td className="p-2">{r["Requested Parts"]}</td>
                                        <td className="p-2">{r["Status"]}</td>
                                        <td className="p-2">{r["Handled By"]}</td>
                                        <td className="p-2">{r["Completion Date"]}</td>
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
                                        {/* No Actions column for history view */}
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
