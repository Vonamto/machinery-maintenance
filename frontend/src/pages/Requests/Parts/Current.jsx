// frontend/src/pages/Requests/Parts/Current.jsx

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Camera,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../context/AuthContext";
import { useCache } from "../../../context/CacheContext";
import CONFIG from "../../../config";

const getThumbnailUrl = (url) => {
  if (!url) return null;
  const match = url.match(/id=([^&]+)/);
  if (match) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
  }
  return url;
};

export default function PartsCurrent() {
  const { user } = useAuth();
  const cache = useCache();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const canEdit =
    user && (user.role === "Supervisor" || user.role === "Mechanic");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${CONFIG.BACKEND_URL}/api/Requests_Parts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const withIndex = data.map((r, i) => ({
            ...r,
            __rowIndex: i + 2,
          }));

          // ✅ ONLY hide Completed & Rejected
          const currentOnly = withIndex.filter(
            (r) =>
              r.Status !== "Completed" &&
              r.Status !== "Rejected"
          );

          setRows(currentOnly.reverse());
        }
      } catch (e) {
        console.error("Load Parts Current failed", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const mechanicSupervisorOptions = (cache.getUsernames?.() || [])
    .filter(
      (u) => u.Role === "Mechanic" || u.Role === "Supervisor"
    )
    .map((u) => u.Name)
    .filter(Boolean);

  const startEdit = (i, r) => {
    setEditingRow(i);
    setEditData({
      rowIndex: r.__rowIndex,
      Status: r.Status || "",
      "Handled By": r["Handled By"] || "",
      Comments: r.Comments || "",
      "Attachment Photo": "",
    });
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setEditData((p) => ({ ...p, "Attachment Photo": reader.result }));
    reader.readAsDataURL(file);
  };

  const saveEdit = async (i) => {
    if (!editData.Status) {
      alert("Please select a status.");
      return;
    }

    if (
      (editData.Status === "Completed" ||
        editData.Status === "Rejected") &&
      !editData["Handled By"]
    ) {
      alert("Handled By is required.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        Status: editData.Status,
        "Handled By": editData["Handled By"],
        Comments: editData.Comments,
        ...(editData["Attachment Photo"] && {
          "Attachment Photo": editData["Attachment Photo"],
        }),
      };

      if (
        editData.Status === "Completed" ||
        editData.Status === "Rejected"
      ) {
        payload["Completion Date"] =
          new Date().toLocaleDateString("en-GB");
      }

      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/edit/Requests_Parts/${editData.rowIndex}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await res.json();

      if (result.status === "success") {
        // ✅ REMOVE ROW for Completed OR Rejected
        if (
          editData.Status === "Completed" ||
          editData.Status === "Rejected"
        ) {
          const copy = [...rows];
          copy.splice(i, 1);
          setRows(copy);
        } else {
          const copy = [...rows];
          copy[i] = {
            ...copy[i],
            ...payload,
          };
          setRows(copy);
        }

        setEditingRow(null);
        setEditData({});
        alert("Request updated successfully.");
      } else {
        alert(result.message || "Update failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (s) => {
    const map = {
      Pending: {
        c: "text-yellow-300 bg-yellow-500/20",
        i: <AlertCircle size={14} />,
      },
      "In Progress": {
        c: "text-blue-300 bg-blue-500/20",
        i: <Clock size={14} />,
      },
      Completed: {
        c: "text-green-300 bg-green-500/20",
        i: <CheckCircle size={14} />,
      },
      Rejected: {
        c: "text-red-300 bg-red-500/20",
        i: <XCircle size={14} />,
      },
    };
    const v = map[s] || map.Pending;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${v.c}`}
      >
        {v.i}
        {s || "Pending"}
      </span>
    );
  };

  if (loading) {
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
      {/* UI BELOW UNCHANGED */}
      {/* … rest of your JSX exactly the same … */}
    </div>
  );
}
