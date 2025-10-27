// frontend/src/pages/Requests/GreaseOil/History.jsx
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import CONFIG from "@/config";

export default function GreaseOilHistory() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch completed/rejected requests
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/Grease_Oil_Requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // Filter only completed or rejected
        const filtered = data.filter(
          (r) =>
            r.Status?.toLowerCase() === "completed" ||
            r.Status?.toLowerCase() === "rejected"
        );
        setRequests(filtered);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />

      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-500">
          🛢️ Grease / Oil Requests History
        </h2>

        {loading ? (
          <p className="text-gray-400">Loading history...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-400">No completed or rejected requests found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-800/60 shadow-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-900 text-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Model / Type</th>
                  <th className="px-4 py-3 text-left">Plate Number</th>
                  <th className="px-4 py-3 text-left">Driver</th>
                  <th className="px-4 py-3 text-left">Request Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Handled By</th>
                  <th className="px-4 py-3 text-left">Completion Date</th>
                  <th className="px-4 py-3 text-left">Comments</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-700 hover:bg-gray-700/40 transition"
                  >
                    <td className="px-4 py-3 text-gray-300">{req["Request Date"]}</td>
                    <td className="px-4 py-3 text-gray-300">{req["Model / Type"]}</td>
                    <td className="px-4 py-3 text-gray-300">{req["Plate Number"]}</td>
                    <td className="px-4 py-3 text-gray-300">{req["Driver"]}</td>
                    <td className="px-4 py-3 text-gray-300">{req["Request Type"]}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          req.Status?.toLowerCase() === "completed"
                            ? "bg-green-600/80 text-white"
                            : req.Status?.toLowerCase() === "rejected"
                            ? "bg-red-600/80 text-white"
                            : "bg-yellow-500/80 text-black"
                        }`}
                      >
                        {req.Status || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{req["Handled By"]}</td>
                    <td className="px-4 py-3 text-gray-300">{req["Completion Date"]}</td>
                    <td className="px-4 py-3 text-gray-300">{req["Comments"]}</td>
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
