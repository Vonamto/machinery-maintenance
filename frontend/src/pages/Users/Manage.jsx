// frontend/src/pages/Users/Manage.jsx

import React, { useEffect, useState } from "react";
import { ArrowLeft, Users, Plus, Trash2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import CONFIG from "@/config";

export default function UsersManage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState({
    Username: "",
    Password: "",
    Role: "Driver",
    Name: "",
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
          __row_index: index + 2, // header row + 1
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
    if (!newUser.Username || !newUser.Password || !newUser.Name) {
      alert("Please fill in Username, Password, and Name.");
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
          Name: "",
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
              <p className="text-gray-400 text-sm mt-1">
                Add or remove system users
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
            {showAddForm ? "Cancel" : (<><Plus size={18} /> Add User</>)}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-400">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newUser.Username}
                    onChange={(e) => setNewUser({ ...newUser, Username: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.Password}
                    onChange={(e) => setNewUser({ ...newUser, Password: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.Name}
                    onChange={(e) => setNewUser({ ...newUser, Name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={newUser.Role}
                    onChange={(e) => setNewUser({ ...newUser, Role: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  >
                    <option value="Supervisor">Supervisor</option>
                    <option value="Mechanic">Mechanic</option>
                    <option value="Driver">Driver</option>
                    <option value="Cleaning Guy">Cleaning Guy</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Adding..." : "Add User"}
              </button>
            </form>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-gray-700 shadow-2xl">
          <table className="min-w-full bg-gray-800/50 backdrop-blur-sm">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
              <tr>
                {["#", "Username", "Name", "Role", "Actions"].map((h) => (
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
                  <td className="p-4 text-sm">{r.Name}</td>
                  <td className="p-4 text-sm">{r.Role}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDeleteUser(r.__row_index, r.Username)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
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
