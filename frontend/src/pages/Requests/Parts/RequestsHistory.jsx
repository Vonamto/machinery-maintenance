// frontend/src/pages/Requests/Parts/RequestsHistory.jsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  History as HistoryIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
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

export default function PartsRequestsHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
          // ✅ Include Completed (with date) and Rejected (even without date)
          const historyRequests = data.filter((row) => {
            const status = (row["Status"] || "").trim().toLowerCase();
            const completionDate = (row["Completion Date"] || "").trim();
            return (
              (status === "completed" && completionDate !== "") ||
              status === "rejected"
            );
          });
          setRows(historyRequests.reverse());
        }
      } catch (err) {
        console.error("Error loading requests history:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getStatusBadge = (status) => {
    const lower = (status || "").toLowerCase();
    const styles = {
      completed: {
        bg: "bg-green-500/20",
        text: "text-green-300",
        icon: <CheckCircle size={14} />,
      },
      rejected: {
        bg: "bg-red-500/20",
        text: "text-red-300",
        icon: <XCircle size={14} />,
      },
    };
    const style = styles[lower] || {
      bg: "bg-gray-500/20",
      text: "text-gray-300",
      icon: <HistoryIcon size={14} />,
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {style.icon}
        {status}
      </span>
    );
  };

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-lg">Loading requests history...</p>
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
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-green-500 shadow-lg shadow-emerald-500/50">
            <HistoryIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
              Parts Requests History
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              View completed and rejected requests
            </p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4 mb-4">
            <p className="text-cyan-400">Loading history...</p>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <HistoryIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              No completed or rejected requests found.
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
                    "Completion Date",
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
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.__original_index || i}
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
                    <td className="p-4">{getStatusBadge(r["Status"])}</td>
                    <td className="p-4 text-sm">
                      {r["Handled By"] || (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">{r["Completion Date"]}</td>
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
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                            <ExternalLink className="w-6 h-6 text-cyan-400" />
                          </div>
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">No Photo</span>
                      )}
                    </td>
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
