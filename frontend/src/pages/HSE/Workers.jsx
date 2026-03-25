// frontend/src/pages/HSE/Workers.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { canUserPerformAction } from "@/config/roles";

const API_BASE = import.meta.env.VITE_API_URL;

const emptyForm = {
  Full_Name: "",
  Position: "",
  Badge_Number: "",
  Phone: "",
};

export default function HSEWorkers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const role = user?.role || "Guest";
  const token = localStorage.getItem("token");

  const canAdd    = canUserPerformAction(role, "HSE_WORKERS_ADD");
  const canEdit   = canUserPerformAction(role, "HSE_WORKERS_EDIT");
  const canDelete = canUserPerformAction(role, "HSE_WORKERS_DELETE");

  const [workers, setWorkers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm]         = useState(emptyForm);
  const [addLoading, setAddLoading]   = useState(false);
  const [editRowIndex, setEditRowIndex] = useState(null);
  const [editForm, setEditForm]       = useState(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [search, setSearch]           = useState("");
  const [alert, setAlert]             = useState(null);

  // ─── Fetch workers ───────────────────────────────────────────
  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/Workers_HSE`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWorkers(Array.isArray(data) ? data : []);
    } catch {
      showAlert("error", t("hse.workers.alerts.networkError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkers(); }, []);

  // ─── Alert helper ─────────────────────────────────────────────
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // ─── Add worker ───────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.Full_Name.trim() || !addForm.Position.trim()) {
      showAlert("error", t("hse.workers.alerts.missingFields"));
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/add/Workers_HSE`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.workers.alerts.addSuccess"));
        setAddForm(emptyForm);
        setShowAddForm(false);
        fetchWorkers();
      } else {
        showAlert("error", data.message || t("hse.workers.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.workers.alerts.networkError"));
    } finally {
      setAddLoading(false);
    }
  };

  // ─── Start edit ───────────────────────────────────────────────
  const startEdit = (worker) => {
    setEditRowIndex(worker.rowindex);
    setEditForm({
      Full_Name:    worker.Full_Name    || "",
      Position:     worker.Position     || "",
      Badge_Number: worker.Badge_Number || "",
      Phone:        worker.Phone        || "",
    });
  };

  // ─── Save edit ────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editForm.Full_Name.trim() || !editForm.Position.trim()) {
      showAlert("error", t("hse.workers.alerts.missingFields"));
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/edit/Workers_HSE/${editRowIndex}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.workers.alerts.editSuccess"));
        setEditRowIndex(null);
        fetchWorkers();
      } else {
        showAlert("error", data.message || t("hse.workers.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.workers.alerts.networkError"));
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Delete worker ────────────────────────────────────────────
  const handleDelete = async (worker) => {
    if (!window.confirm(
      t("hse.workers.alerts.deleteConfirm", { name: worker.Full_Name })
    )) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/delete/Workers_HSE/${worker.rowindex}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.workers.alerts.deleteSuccess"));
        fetchWorkers();
      } else {
        showAlert("error", data.message || t("hse.workers.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.workers.alerts.networkError"));
    }
  };

  // ─── Filtered list ────────────────────────────────────────────
  const filtered = workers.filter((w) => {
    const q = search.toLowerCase();
    return (
      (w.Full_Name    || "").toLowerCase().includes(q) ||
      (w.Position     || "").toLowerCase().includes(q) ||
      (w.Badge_Number || "").toLowerCase().includes(q) ||
      (w.Phone        || "").toLowerCase().includes(q)
    );
  });

  // ─── Shared input style ───────────────────────────────────────
  const inputClass =
    "w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />

      <div className="p-6 max-w-6xl mx-auto">

        {/* ── Alert ── */}
        {alert && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
              alert.type === "success"
                ? "bg-green-800/60 text-green-200 border border-green-600"
                : "bg-red-800/60 text-red-200 border border-red-600"
            }`}
          >
            {alert.message}
          </div>
        )}

        {/* ── Header ── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to="/hse"
              className="text-sm text-gray-400 hover:text-white transition mb-1 inline-block"
            >
              ← {t("common.back")}
            </Link>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              {t("hse.workers.title")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {t("hse.workers.subtitle")}
            </p>
          </div>

          {canAdd && (
            <button
              onClick={() => { setShowAddForm(!showAddForm); setAddForm(emptyForm); }}
              className="px-5 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-sm transition"
            >
              {showAddForm ? t("common.cancel") : `+ ${t("hse.workers.addButton")}`}
            </button>
          )}
        </div>

        {/* ── Add Form ── */}
        {canAdd && showAddForm && (
          <div className="mb-6 bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-yellow-400 mb-4">
              {t("hse.workers.addForm.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.workers.fields.fullName")} *
                </label>
                <input
                  className={inputClass}
                  value={addForm.Full_Name}
                  onChange={(e) => setAddForm({ ...addForm, Full_Name: e.target.value })}
                  placeholder={t("hse.workers.placeholders.fullName")}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.workers.fields.position")} *
                </label>
                <input
                  className={inputClass}
                  value={addForm.Position}
                  onChange={(e) => setAddForm({ ...addForm, Position: e.target.value })}
                  placeholder={t("hse.workers.placeholders.position")}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.workers.fields.badgeNumber")}
                </label>
                <input
                  className={inputClass}
                  value={addForm.Badge_Number}
                  onChange={(e) => setAddForm({ ...addForm, Badge_Number: e.target.value })}
                  placeholder={t("hse.workers.placeholders.badgeNumber")}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.workers.fields.phone")}
                </label>
                <input
                  className={inputClass}
                  value={addForm.Phone}
                  onChange={(e) => setAddForm({ ...addForm, Phone: e.target.value })}
                  placeholder={t("hse.workers.placeholders.phone")}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAdd}
                disabled={addLoading}
                className="px-5 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {addLoading ? t("common.submitting") : t("hse.workers.addForm.submit")}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* ── Search Bar ── */}
        <div className="mb-4">
          <input
            className="w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
            placeholder={t("hse.workers.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ── Table ── */}
        {loading ? (
          <p className="text-gray-400 text-sm">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">{t("hse.workers.noResults")}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t("hse.workers.table.fullName")}</th>
                  <th className="px-4 py-3">{t("hse.workers.table.position")}</th>
                  <th className="px-4 py-3">{t("hse.workers.table.badgeNumber")}</th>
                  <th className="px-4 py-3">{t("hse.workers.table.phone")}</th>
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3">{t("common.actions")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((worker, idx) =>
                  editRowIndex === worker.rowindex ? (
                    // ── Inline Edit Row ──
                    <tr key={worker.rowindex} className="bg-gray-700 border-t border-gray-600">
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <input
                          className={inputClass}
                          value={editForm.Full_Name}
                          onChange={(e) => setEditForm({ ...editForm, Full_Name: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className={inputClass}
                          value={editForm.Position}
                          onChange={(e) => setEditForm({ ...editForm, Position: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className={inputClass}
                          value={editForm.Badge_Number}
                          onChange={(e) => setEditForm({ ...editForm, Badge_Number: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className={inputClass}
                          value={editForm.Phone}
                          onChange={(e) => setEditForm({ ...editForm, Phone: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={editLoading}
                            className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition disabled:opacity-50"
                          >
                            {editLoading ? t("common.submitting") : t("common.submit")}
                          </button>
                          <button
                            onClick={() => setEditRowIndex(null)}
                            className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs transition"
                          >
                            {t("common.cancel")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // ── Normal Row ──
                    <tr
                      key={worker.rowindex}
                      className="border-t border-gray-700 hover:bg-gray-800/50 transition"
                    >
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{worker.Full_Name}</td>
                      <td className="px-4 py-3 text-gray-300">{worker.Position}</td>
                      <td className="px-4 py-3 text-gray-300">{worker.Badge_Number || "—"}</td>
                      <td className="px-4 py-3 text-gray-300">{worker.Phone || "—"}</td>
                      {(canEdit || canDelete) && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {canEdit && (
                              <button
                                onClick={() => startEdit(worker)}
                                className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition"
                              >
                                {t("common.edit")}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(worker)}
                                className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition"
                              >
                                {t("common.delete")}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
