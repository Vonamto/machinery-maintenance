// frontend/src/pages/Equipment/Manage.jsx

import React, { useEffect, useState } from "react";
import { ArrowLeft, Truck, Plus, Trash2, AlertCircle, Pencil } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";

export default function EquipmentManage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [newEquipment, setNewEquipment] = useState({
    "Model / Type": "",
    "Plate Number": "",
    "Driver 1": "",
    "Driver 2": "",
    Status: "Active",
    Notes: "",
  });

  if (user?.role !== "Supervisor") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-300">Only Supervisors can manage equipment.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/Equipment_List`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const dataWithIndex = data.map((row, index) => ({
          ...row,
          __row_index: index + 2,
        }));
        setRows(dataWithIndex);
      }
    } catch (err) {
      console.error("Error loading equipment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();

    if (!newEquipment["Model / Type"] || !newEquipment["Plate Number"]) {
      alert("Please fill in Model/Type and Plate Number.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/add/Equipment_List`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEquipment),
      });
      const data = await res.json();

      if (data.status === "success") {
        alert("✅ Equipment added successfully!");
        setShowAddForm(false);
        setNewEquipment({
          "Model / Type": "",
          "Plate Number": "",
          "Driver 1": "",
          "Driver 2": "",
          Status: "Active",
          Notes: "",
        });
        loadEquipment();
      } else {
        alert("❌ Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Add equipment error:", err);
      alert("Network error adding equipment.");
    } finally {
      setSaving(false);
    }
  };

  // adding handleDeleteEquipment function in Manage.jsx with this:

const handleDeleteEquipment = async (rowIndex, plateNumber) => {
  const confirmed = window.confirm(
    `Are you sure you want to PERMANENTLY DELETE equipment "${plateNumber}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  setSaving(true);
  try {
    const token = localStorage.getItem("token");
    
    // ✅ NEW: Use DELETE method to completely remove the row
    const res = await fetch(
      `${CONFIG.BACKEND_URL}/api/delete/Equipment_List/${rowIndex}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    const data = await res.json();

    if (data.status === "success") {
      alert("✅ Equipment deleted successfully!");
      loadEquipment(); // Reload the list
    } else {
      alert("❌ Error: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Delete equipment error:", err);
    alert("Network error deleting equipment.");
  } finally {
    setSaving(false);
  }
};

  // ✅ FIXED: Added "data:" property name
  const handleEditClick = (row, index) => {
    setEditingRow({
      index,
      rowIndexInSheet: row.__row_index,
      data: {
        "Model / Type": row["Model / Type"] || "",
        "Plate Number": row["Plate Number"] || "",
        "Driver 1": row["Driver 1"] || "",
        "Driver 2": row["Driver 2"] || "",
        Status: row["Status"] || "Active",
        Notes: row["Notes"] || "",
      },
    });
  };

  const handleEditChange = (field, value) => {
    if (editingRow) {
      setEditingRow({
        ...editingRow,
        data: {
          ...editingRow.data,
          [field]: value,
        },
      });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const { rowIndexInSheet, data } = editingRow;

    if (!data["Model / Type"] || !data["Plate Number"]) {
      alert("Please fill in Model/Type and Plate Number.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${CONFIG.BACKEND_URL}/api/edit/Equipment_List/${rowIndexInSheet}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      const result = await res.json();

      if (result.status === "success") {
        alert("✅ Equipment updated successfully!");
        setEditingRow(null);
        loadEquipment();
      } else {
        alert("❌ Error: " + (result.message || "Failed to update equipment."));
      }
    } catch (err) {
      console.error("Edit equipment error:", err);
      alert("Network error updating equipment.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingRow(null);
  };

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-lg">Loading equipment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 shadow-lg shadow-red-500/40">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">
                Manage Equipment
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Add, edit, or remove equipment entries
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base rounded-xl font-semibold shadow-lg transition-all whitespace-nowrap ${
              showAddForm
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white shadow-green-500/30"
            }`}
          >
            {showAddForm ? "Cancel" : <><Plus size={18} /> Add Equipment</>}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-orange-400">Add New Equipment</h2>
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Model / Type *
                  </label>
                  <input
                    type="text"
                    value={newEquipment["Model / Type"]}
                    onChange={(e) =>
                      setNewEquipment({ ...newEquipment, "Model / Type": e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="e.g., Mercedes, MAN, Toyota"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    value={newEquipment["Plate Number"]}
                    onChange={(e) =>
                      setNewEquipment({ ...newEquipment, "Plate Number": e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="e.g., ABC-123"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Driver 1
                  </label>
                  <input
                    type="text"
                    value={newEquipment["Driver 1"]}
                    onChange={(e) =>
                      setNewEquipment({ ...newEquipment, "Driver 1": e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Driver 2
                  </label>
                  <input
                    type="text"
                    value={newEquipment["Driver 2"]}
                    onChange={(e) =>
                      setNewEquipment({ ...newEquipment, "Driver 2": e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={newEquipment.Status}
                    onChange={(e) => setNewEquipment({ ...newEquipment, Status: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={newEquipment.Notes}
                    onChange={(e) => setNewEquipment({ ...newEquipment, Notes: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Adding..." : "Add Equipment"}
              </button>
            </form>
          </div>
        )}

        {editingRow && (
          <div className="mb-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Edit Equipment</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Model / Type *
                  </label>
                  <input
                    type="text"
                    value={editingRow.data["Model / Type"]}
                    onChange={(e) => handleEditChange("Model / Type", e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., Mercedes, MAN, Toyota"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    value={editingRow.data["Plate Number"]}
                    onChange={(e) => handleEditChange("Plate Number", e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g., ABC-123"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Driver 1
                  </label>
                  <input
                    type="text"
                    value={editingRow.data["Driver 1"]}
                    onChange={(e) => handleEditChange("Driver 1", e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Driver 2
                  </label>
                  <input
                    type="text"
                    value={editingRow.data["Driver 2"]}
                    onChange={(e) => handleEditChange("Driver 2", e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editingRow.data.Status}
                    onChange={(e) => handleEditChange("Status", e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={editingRow.data.Notes}
                    onChange={(e) => handleEditChange("Notes", e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-gray-700 shadow-2xl">
          <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
              <tr>
                {[
                  "#",
                  "Model / Type",
                  "Plate Number",
                  "Driver 1",
                  "Driver 2",
                  "Status",
                  "Notes",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="p-4 text-left text-sm font-semibold text-gray-300">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={`border-t border-gray-700 hover:bg-white/5 transition-colors ${
                    i % 2 === 0 ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <td className="p-4 text-sm text-gray-400">{i + 1}</td>
                  <td className="p-4 text-sm">{r["Model / Type"]}</td>
                  <td className="p-4 text-sm font-mono">{r["Plate Number"]}</td>
                  <td className="p-4 text-sm">{r["Driver 1"] || <span className="text-gray-500">---</span>}</td>
                  <td className="p-4 text-sm">{r["Driver 2"] || <span className="text-gray-500">---</span>}</td>
                  <td className="p-4 text-sm">{r["Status"]}</td>
                  <td className="p-4 text-sm max-w-xs truncate">
                    {r["Notes"] || <span className="text-gray-500">---</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEditClick(r, i)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEquipment(r.__row_index, r["Plate Number"])}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
