// frontend/src/pages/HSE/PPEHistory.jsx

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { canUserPerformAction } from "@/config/roles";

const API_BASE = import.meta.env.VITE_API_URL;

export default function PPEHistory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const role  = user?.role || "Guest";
  const token = localStorage.getItem("token");

  const canEdit   = canUserPerformAction(role, "HSE_HISTORY_EDIT");
  const canDelete = canUserPerformAction(role, "HSE_HISTORY_DELETE");

  // ── Data ──────────────────────────────────────────────────────
  const [distLog,      setDistLog]      = useState([]);
  const [workers,      setWorkers]      = useState([]);
  const [ppeTypes,     setPpeTypes]     = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [loading,      setLoading]      = useState(true);

  // ── Filters ───────────────────────────────────────────────────
  const [filterWorker, setFilterWorker] = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [filterFrom,   setFilterFrom]   = useState("");
  const [filterTo,     setFilterTo]     = useState("");

  // ── Edit state ────────────────────────────────────────────────
  const [editEntry,     setEditEntry]     = useState(null);
  const [editForm,      setEditForm]      = useState({});
  const [editLoading,   setEditLoading]   = useState(false);
  const [workerQuery,   setWorkerQuery]   = useState("");
  const [workerFocused, setWorkerFocused] = useState(false);
  const [workerLocked,  setWorkerLocked]  = useState(false);

  // ── Delete confirm modal ───────────────────────────────────────
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Alert ─────────────────────────────────────────────────────
  const [alert, setAlert] = useState(null);
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // ── Fetch all in parallel ─────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [d, w, p, s] = await Promise.all([
        fetch(`${API_BASE}/api/PPE_Distribution_Log`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/Workers_HSE`,          { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/PPE_Types`,            { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/PPE_Stock`,            { headers }).then((r) => r.json()),
      ]);
      setDistLog     (Array.isArray(d) ? d : []);
      setWorkers     (Array.isArray(w) ? w : []);
      setPpeTypes    (Array.isArray(p) ? p : []);
      setStockEntries(Array.isArray(s) ? s : []);
    } catch {
      showAlert("error", t("hse.history.alerts.networkError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Available qty map (stock − distributed) ───────────────────
  const availableQty = useMemo(() => {
    const map = {};
    stockEntries.forEach((e) => {
      const key = `${e.PPE_Type}||${e.Size || ""}`;
      map[key] = (map[key] || 0) + Number(e.Quantity || 0);
    });
    distLog.forEach((e) => {
      const key = `${e.PPE_Type}||${e.Size || ""}`;
      map[key] = (map[key] || 0) - Number(e.Quantity || 0);
    });
    return map;
  }, [stockEntries, distLog]);

  // ── Filtered table ────────────────────────────────────────────
  const filtered = distLog.filter((e) => {
    const matchWorker = !filterWorker || (e.Worker_Name || "").toLowerCase().includes(filterWorker.toLowerCase());
    const matchType   = !filterType   || e.PPE_Type === filterType;
    const matchFrom   = !filterFrom   || (e.Date || "") >= filterFrom;
    const matchTo     = !filterTo     || (e.Date || "") <= filterTo;
    return matchWorker && matchType && matchFrom && matchTo;
  });

  // ── Edit helpers ──────────────────────────────────────────────
  const startEdit = (entry) => {
    setEditEntry(entry);
    setEditForm({
      Date:            entry.Date            || "",
      Worker_Name:     entry.Worker_Name     || "",
      Worker_Position: entry.Worker_Position || "",
      PPE_Type:        entry.PPE_Type        || "",
      Size:            entry.Size            || "",
      Quantity:        entry.Quantity        || "",
      Notes:           entry.Notes           || "",
    });
    setWorkerQuery(entry.Worker_Name || "");
    setWorkerLocked(true);
  };

  const cancelEdit = () => {
    setEditEntry(null);
    setWorkerQuery("");
    setWorkerLocked(false);
  };

  const editTypeHasSize =
    ppeTypes.find((p) => p.Name === editForm.PPE_Type)?.Has_Size === "YES";

  // Sizes available for the edit form (adds back original qty for same type+size)
  const editAvailableSizes = useMemo(() => {
    if (!editEntry || !editForm.PPE_Type) return [];
    const keys = Object.keys(availableQty).filter(
      (k) => k.startsWith(`${editForm.PPE_Type}||`) && !k.endsWith("||")
    );
    return keys.map((k) => {
      const size    = k.split("||")[1];
      const oldKey  = `${editEntry.PPE_Type}||${editEntry.Size || ""}`;
      const addBack = oldKey === k ? Number(editEntry.Quantity || 0) : 0;
      return { size, qty: (availableQty[k] || 0) + addBack };
    });
  }, [editForm.PPE_Type, editEntry, availableQty]);

  // Max available for current edit selection
  const editCurrentAvailable = () => {
    if (!editEntry) return 0;
    const oldKey = `${editEntry.PPE_Type}||${editEntry.Size || ""}`;
    const newKey = `${editForm.PPE_Type}||${editTypeHasSize ? editForm.Size : ""}`;
    const base   = availableQty[newKey] || 0;
    return oldKey === newKey ? base + Number(editEntry.Quantity || 0) : base;
  };

  const filteredWorkersEdit = workers.filter((w) =>
    (w.Full_Name || "").toLowerCase().includes(workerQuery.toLowerCase())
  );

  const selectWorkerEdit = (worker) => {
    setWorkerQuery(worker.Full_Name);
    setWorkerLocked(true);
    setWorkerFocused(false);
    setEditForm((f) => ({ ...f, Worker_Name: worker.Full_Name, Worker_Position: worker.Position || "" }));
  };

  const clearWorkerEdit = () => {
    setWorkerQuery("");
    setWorkerLocked(false);
    setEditForm((f) => ({ ...f, Worker_Name: "", Worker_Position: "" }));
  };

  const handleSaveEdit = async () => {
    if (!editForm.Worker_Name)                              { showAlert("error", t("hse.history.alerts.missingWorker")); return; }
    if (!editForm.PPE_Type)                                 { showAlert("error", t("hse.history.alerts.missingType"));   return; }
    if (editTypeHasSize && !editForm.Size)                  { showAlert("error", t("hse.history.alerts.missingSize"));   return; }
    if (!editForm.Quantity || Number(editForm.Quantity) <=0){ showAlert("error", t("hse.history.alerts.missingQty"));   return; }
    if (Number(editForm.Quantity) > editCurrentAvailable()) {
      showAlert("error", t("hse.history.alerts.exceedsStock", { max: editCurrentAvailable() })); return;
    }

    setEditLoading(true);
    try {
      const payload = {
        Date:            editForm.Date,
        Worker_Name:     editForm.Worker_Name,
        Worker_Position: editForm.Worker_Position,
        PPE_Type:        editForm.PPE_Type,
        Size:            editTypeHasSize ? editForm.Size : "",
        Quantity:        editForm.Quantity,
        Notes:           editForm.Notes,
      };
      const res  = await fetch(
        `${API_BASE}/api/hse/edit-distribution/${editEntry.rowindex}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.history.alerts.editSuccess"));
        cancelEdit();
        fetchAll();
      } else {
        showAlert("error", data.message || t("hse.history.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.history.alerts.networkError"));
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete handlers ───────────────────────────────────────────
  const handleDelete = async (returnToStock) => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res  = await fetch(
        `${API_BASE}/api/hse/delete-distribution/${deleteTarget.rowindex}?return_to_stock=${returnToStock}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.status === "success") {
        showAlert(
          "success",
          returnToStock
            ? t("hse.history.alerts.deleteReturnSuccess")
            : t("hse.history.alerts.deleteSuccess")
        );
        setDeleteTarget(null);
        fetchAll();
      } else {
        showAlert("error", data.message || t("hse.history.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.history.alerts.networkError"));
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────
  const inp    = "w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500";
  const locked = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-sm cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />
      <div className="p-6 max-w-7xl mx-auto">

        {/* Alert */}
        {alert && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            alert.type === "success"
              ? "bg-green-800/60 text-green-200 border border-green-600"
              : "bg-red-800/60 text-red-200 border border-red-600"
          }`}>
            {alert.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <Link to="/hse" className="text-sm text-gray-400 hover:text-white transition mb-1 inline-block">
            ← {t("common.back")}
          </Link>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">
            {t("hse.history.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t("hse.history.subtitle")}</p>
        </div>

        {/* ── Edit Panel ── */}
        {editEntry && (
          <div className="mb-6 bg-gray-800 border border-green-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-green-400 mb-4">
              {t("hse.history.editForm.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Date */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t("hse.history.fields.date")} *</label>
                <input type="date" className={inp} value={editForm.Date}
                  onChange={(e) => setEditForm({ ...editForm, Date: e.target.value })} />
              </div>

              {/* Given By — locked */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t("hse.history.fields.givenBy")}</label>
                <input className={locked} value={editEntry.Given_By || ""} readOnly />
              </div>

              {/* Worker Name — autocomplete */}
              <div className="relative">
                <label className="text-xs text-gray-400 mb-1 block">{t("hse.history.fields.workerName")} *</label>
                <div className="flex gap-2">
                  <input
                    className={inp}
                    value={workerQuery}
                    readOnly={workerLocked}
                    placeholder={t("hse.history.placeholders.workerName")}
                    onChange={(e) => {
                      setWorkerQuery(e.target.value);
                      setEditForm((f) => ({ ...f, Worker_Name: "", Worker_Position: "" }));
                    }}
                    onFocus={() => !workerLocked && setWorkerFocused(true)}
                    onBlur={() => setTimeout(() => setWorkerFocused(false), 150)}
                  />
                  {workerLocked && (
                    <button onClick={clearWorkerEdit}
                      className="px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xs transition">
                      ✕
                    </button>
                  )}
                </div>
                {workerFocused && !workerLocked && filteredWorkersEdit.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                    {filteredWorkersEdit.map((w) => (
                      <li key={w.rowindex} onMouseDown={() => selectWorkerEdit(w)}
                        className="px-4 py-2 text-sm text-white hover:bg-green-700 cursor-pointer transition">
                        <span className="font-medium">{w.Full_Name}</span>
                        <span className="text-gray-400 text-xs ml-2">— {w.Position}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Worker Position — locked */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t("hse.history.fields.workerPosition")}</label>
                <input className={locked} value={editForm.Worker_Position} readOnly />
              </div>

              {/* PPE Type */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t("hse.history.fields.ppeType")} *</label>
                <select className={inp} value={editForm.PPE_Type}
                  onChange={(e) => setEditForm({ ...editForm, PPE_Type: e.target.value, Size: "", Quantity: "" })}>
                  <option value="">{t("hse.history.placeholders.ppeType")}</option>
                  {ppeTypes.map((type) => (
                    <option key={type.rowindex} value={type.Name}>{type.Name}</option>
                  ))}
                </select>
              </div>

              {/* Size — conditional */}
              {editTypeHasSize && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t("hse.history.fields.size")} *</label>
                  <select className={inp} value={editForm.Size}
                    onChange={(e) => setEditForm({ ...editForm, Size: e.target.value, Quantity: "" })}>
                    <option value="">{t("hse.history.placeholders.size")}</option>
                    {editAvailableSizes.map(({ size, qty }) => (
                      <option key={size} value={size} disabled={qty <= 0}>
                        {size}{qty <= 0
                          ? ` (${t("hse.distribute.outOfStock")})`
                          : ` — ${t("hse.distribute.available")}: ${qty}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.history.fields.quantity")} *
                  {editForm.PPE_Type && (
                    <span className="ml-2 text-green-400">
                      ({t("hse.distribute.available")}: {editCurrentAvailable()})
                    </span>
                  )}
                </label>
                <input type="number" min="1" max={editCurrentAvailable()} className={inp}
                  value={editForm.Quantity} placeholder="0"
                  onChange={(e) => setEditForm({ ...editForm, Quantity: e.target.value })} />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">{t("hse.history.fields.notes")}</label>
                <input className={inp} value={editForm.Notes}
                  placeholder={t("hse.history.placeholders.notes")}
                  onChange={(e) => setEditForm({ ...editForm, Notes: e.target.value })} />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={handleSaveEdit} disabled={editLoading}
                className="px-5 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition disabled:opacity-50">
                {editLoading ? t("common.submitting") : t("common.submit")}
              </button>
              <button onClick={cancelEdit}
                className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition">
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            placeholder={t("hse.history.filters.worker")}
            value={filterWorker}
            onChange={(e) => setFilterWorker(e.target.value)}
          />
          <select
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">{t("hse.history.filters.allTypes")}</option>
            {ppeTypes.map((p) => (
              <option key={p.rowindex} value={p.Name}>{p.Name}</option>
            ))}
          </select>
          <input type="date"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
          />
          <input type="date"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
        {(filterWorker || filterType || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterWorker(""); setFilterType(""); setFilterFrom(""); setFilterTo(""); }}
            className="mb-4 text-xs text-gray-400 hover:text-white transition underline"
          >
            {t("hse.history.filters.reset")}
          </button>
        )}

        {/* ── Table ── */}
        {loading ? (
          <p className="text-gray-400 text-sm">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">{t("hse.history.noResults")}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t("hse.history.table.date")}</th>
                  <th className="px-4 py-3">{t("hse.history.table.workerName")}</th>
                  <th className="px-4 py-3">{t("hse.history.table.workerPosition")}</th>
                  <th className="px-4 py-3">{t("hse.history.table.ppeType")}</th>
                  <th className="px-4 py-3">{t("hse.history.table.size")}</th>
                  <th className="px-4 py-3">{t("hse.history.table.quantity")}</th>
                  <th className="px-4 py-3">{t("hse.history.table.givenBy")}</th>
                  <th className="px-4 py-3">{t("hse.history.table.notes")}</th>
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3">{t("common.actions")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, idx) => (
                  <tr key={entry.rowindex}
                    className="border-t border-gray-700 hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{entry.Date}</td>
                    <td className="px-4 py-3 font-medium">{entry.Worker_Name}</td>
                    <td className="px-4 py-3 text-gray-300">{entry.Worker_Position}</td>
                    <td className="px-4 py-3 text-gray-300">{entry.PPE_Type}</td>
                    <td className="px-4 py-3 text-gray-300">{entry.Size || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-green-900/50 text-green-300 text-xs font-bold">
                        {entry.Quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{entry.Given_By}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{entry.Notes || "—"}</td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {canEdit && (
                            <button onClick={() => startEdit(entry)}
                              className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition">
                              {t("common.edit")}
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteTarget(entry)}
                              className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition">
                              {t("common.delete")}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-600 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2">
                {t("hse.history.deleteModal.title")}
              </h3>
              <p className="text-gray-300 text-sm mb-1">
                <span className="text-white font-medium">{deleteTarget.Worker_Name}</span>
                {" — "}{deleteTarget.PPE_Type}
                {deleteTarget.Size ? ` (${deleteTarget.Size})` : ""}
                {" × "}<span className="text-yellow-300 font-bold">{deleteTarget.Quantity}</span>
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {t("hse.history.deleteModal.question")}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleDelete(true)}
                  disabled={deleteLoading}
                  className="w-full px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  ✅ {t("hse.history.deleteModal.deleteReturn")}
                </button>
                <button
                  onClick={() => handleDelete(false)}
                  disabled={deleteLoading}
                  className="w-full px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  🗑️ {t("hse.history.deleteModal.deleteOnly")}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteLoading}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
