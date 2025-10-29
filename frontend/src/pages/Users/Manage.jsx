// frontend/src/pages/Users/Manage.jsx

import React, { useEffect, useState } from "react";
import { ArrowLeft, Users, Plus, Trash2, Pencil, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";

export default function UsersManage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState({
    Username: "",
    Password: "",
    Role: "Driver",
    "Full Name": "",
  });

  // Only Supervisors can access
  if (user?.role !== "Supervisor") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-300">Only Supervisors can manage users.</p>
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
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/Users`, {
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
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.Username || !newUser.Password || !newUser["Full Name"]) {
      alert("Please fill in Username, Password, and Full Name.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/add/Users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();

      if (data.status === "success") {
        alert("✅ User added successfully!");
        setShowAddForm(false);
        setNewUser({
          Username: "",
          Password: "",
          Role: "Driver",
          "Full Name": "",
        });
        loadUsers();
      } else {
        alert("❌ Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Add user error:", err);
      alert("Network error adding user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (rowIndex, username) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${username}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/delete/Users/${rowIndex}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.status === "success") {
        alert("✅ User deleted successfully!");
        loadUsers();
      } else {
        alert("❌ Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Delete user error:", err);
      alert("Network error deleting user.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (row) => {
    setEditingRow({
      ...row,
      data: {
        Username: row.Username || "",
        Password: row.Password || "",
        Role: row.Role || "",
        "Full Name": row["Full Name"] || "",
      },
    });
  };

  const handleEditChange = (field, value) => {
    setEditingRow({
      ...editingRow,
      data: { ...editingRow.data, [field]: value },
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const { __row_index, data } = editingRow;

    if (!data.Username || !data.Password || !data["Full Name"]) {
      alert("Please fill in Username, Password, and Full Name.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/edit/Users/${__row_index}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (result.status === "success") {
        alert("✅ User updated successfully!");
        setEditingRow(null);
        loadUsers();
      } else {
        alert("❌ Error: " + (result.message || "Failed to update user."));
      }
    } catch (err) {
      console.error("Edit user error:", err);
      alert("Network error updating user.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => setEditingRow(null);

  if (loading && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-lg">Loading users...</p>
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/40">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                Manage Users
              </h1>
              <p className="text-gray-400 text-sm mt-1">Add, edit, or remove system users</p>
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
            {showAddForm ? "Cancel" : (
              <>
                <Plus size={18} /> Add User
              </>
            )}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-400">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UserInputs user={newUser} setUser={setNewUser} />
              </div>
              <SubmitButton saving={saving} text="Add User" />
            </form>
          </div>
        )}

        {/* Edit Form */}
        {editingRow && (
          <div className="mb-8 bg-gray-800/40 border border-gray-700 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Edit User</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UserInputs user={editingRow.data} setUser={(u) => setEditingRow({ ...editingRow, data: u })} />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <SubmitButton saving={saving} text="Save Changes" />
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-700 shadow-2xl">
          <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
              <tr>
                {["#", "Username", "Full Name", "Role", "Actions"].map((h) => (
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
                  <td className="p-4 text-sm">{r.Username}</td>
                  <td className="p-4 text-sm">{r["Full Name"]}</td>
                  <td className="p-4 text-sm">{r.Role}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEditClick(r)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(r.__row_index, r.Username)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-red-500/30 disabled:opacity-50"
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

// 🧩 Reusable subcomponents for cleaner JSX
function UserInputs({ user, setUser }) {
  return (
    <>
      {["Username", "Password", "Full Name"].map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {field} *
          </label>
          <input
            type={field === "Password" ? "password" : "text"}
            value={user[field]}
            onChange={(e) => setUser({ ...user, [field]: e.target.value })}
            className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            required
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
        <select
          value={user.Role}
          onChange={(e) => setUser({ ...user, Role: e.target.value })}
          className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
        >
          <option value="Supervisor">Supervisor</option>
          <option value="Mechanic">Mechanic</option>
          <option value="Driver">Driver</option>
          <option value="Cleaning Guy">Cleaning Guy</option>
        </select>
      </div>
    </>
  );
}

function SubmitButton({ saving, text }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving ? "Saving..." : text}
    </button>
  );
}
