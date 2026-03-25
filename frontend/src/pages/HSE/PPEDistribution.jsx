// frontend/src/pages/HSE/PPEDistribution.jsx

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { canUserPerformAction } from "@/config/roles";

const API_BASE = import.meta.env.VITE_API_URL;

const emptyForm = {
  Date: "",
  Worker_Name: "",
  Worker_Position: "",
  PPE_Type: "",
  Size: "",
  Quantity: "",
  Given_By: "",
  Notes: "",
};

export default function PPEDistribution() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const role  = user?.role || "Guest";
  const token = localStorage.getItem("token");

  const canDistribute = canUserPerformAction(role, "HSE_DISTRIBUTE_ADD");
  const givenBy       = user?.full_name || user?.username || "";
  const today         = () => new Date().toISOString().split("T")[0];

  // ── Data ──────────────────────────────────────────────────────
  const [workers,      setWorkers]      = useState([]);
  const [ppeTypes,     setPpeTypes]     = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [distEntries,  setDistEntries]  = useState([]);
  const [loading,      setLoading]      = useState(true);

  // ── Form ──────────────────────────────────────────────────────
  const [form,         setForm]         = useState({ ...emptyForm, Date: today(), Given_By: givenBy });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert,        setAlert]        = useState(null);

  // ── Worker autocomplete ───────────────────────────────────────
  const [workerQuery,   setWorkerQuery]   = useState("");
  const [workerFocused, setWorkerFocused] = useState(false);
  const [workerLocked,  setWorkerLocked]  = useState(false);

  // ── Alert helper ──────────────────────────────────────────────
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // ── Fetch all data in parallel ────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [w, p, s, d] = await Promise.all([
        fetch(`${API_BASE}/api/Workers_HSE`,      { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/PPE_Types`,         { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/PPE_Stock`,         { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/PPE_Distribution`,  { headers }).then((r) => r.json()),
      ]);
      setWorkers     (Array.isArray(w) ? w : []);
      setPpeTypes    (Array.isArray(p) ? p : []);
      setStockEntries(Array.isArray(s) ? s : []);
      setDistEntries (Array.isArray(d) ? d : []);
    } catch {
      showAlert("error", t("hse.distribute.alerts.networkError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Stock calculator ──────────────────────────────────────────
  // Returns available qty for a given type+size
  const availableQty = useMemo(() => {
    const map = {};

    stockEntries.forEach((e) => {
      const key = `${e.PPE_Type}||${e.Size || ""}`;
      map[key] = (map[key] || 0) + Number(e.Quantity || 0);
    });

    distEntries.forEach((e) => {
      const key = `${e.PPE_Type}||${e.Size || ""}`;
      map[key] = (map[key] || 0) - Number(e.Quantity || 0);
    });

    return map; // key → available qty (can be negative if data error)
  }, [stockEntries, distEntries]);

  // Is a PPE type fully depleted (all sizes/quantities = 0)?
  const isTypeDepleted = (typeName) => {
    const typeHasSize = ppeTypes.find((p) => p.Name === typeName)?.Has_Size === "YES";
    if (!typeHasSize) {
      return (availableQty[`${typeName}||`] || 0) <= 0;
    }
    // Has sizes — check if ALL sizes are depleted
    const relevantKeys = Object.keys(availableQty).filter((k) =>
      k.startsWith(`${typeName}||`) && !k.endsWith("||")
    );
    if (relevantKeys.length === 0) return true;
    return relevantKeys.every((k) => availableQty[k] <= 0);
  };

  // Get available sizes for selected PPE type
  const availableSizes = useMemo(() => {
    if (!form.PPE_Type) return [];
    return Object.keys(availableQty)
      .filter((k) => k.startsWith(`${form.PPE_Type}||`) && !k.endsWith("||"))
      .map((k) => ({
        size: k.split("||")[1],
        qty:  availableQty[k],
      }));
  }, [form.PPE_Type, availableQty]);

  const selectedTypeHasSize =
    ppeTypes.find((p) => p.Name === form.PPE_Type)?.Has_Size === "YES";

  const currentAvailable = selectedTypeHasSize
    ? availableQty[`${form.PPE_Type}||${form.Size}`] || 0
    : availableQty[`${form.PPE_Type}||`] || 0;

  // ── Worker autocomplete handlers ──────────────────────────────
  const filteredWorkers = workers.filter((w) =>
    (w.Full_Name || "").toLowerCase().includes(workerQuery.toLowerCase())
  );

  const selectWorker = (worker) => {
    setWorkerQuery(worker.Full_Name);
    setWorkerLocked(true);
    setWorkerFocused(false);
    setForm((f) => ({
      ...f,
      Worker_Name:     worker.Full_Name,
      Worker_Position: worker.Position || "",
    }));
  };

  const clearWorker = () => {
    setWorkerQuery("");
    setWorkerLocked(false);
    setForm((f) => ({ ...f, Worker_Name: "", Worker_Position: "" }));
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.Worker_Name) {
      showAlert("error", t("hse.distribute.alerts.missingWorker")); return;
    }
    if (!form.PPE_Type) {
      showAlert("error", t("hse.distribute.alerts.missingType")); return;
    }
    if (selectedTypeHasSize && !form.Size) {
      showAlert("error", t("hse.distribute.alerts.missingSize")); return;
    }
    if (!form.Quantity || Number(form.Quantity) <= 0) {
      showAlert("error", t("hse.distribute.alerts.missingQty")); return;
    }
    if (Number(form.Quantity) > currentAvailable) {
      showAlert("error", t("hse.distribute.alerts.exceedsStock", { max: currentAvailable }));
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        Date:             form.Date,
        Worker_Name:      form.Worker_Name,
        Worker_Position:  form.Worker_Position,
        PPE_Type:         form.PPE_Type,
        Size:             selectedTypeHasSize ? form.Size : "",
        Quantity:         form.Quantity,
        Given_By:         givenBy,
        Notes:            form.Notes,
      };

      const res  = await fetch(`${API_BASE}/api/add/PPE_Distribution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === "success") {
        showAlert("success", t("hse.distribute.alerts.success"));
        // Reset form but keep date and Given_By
        setForm({ ...emptyForm, Date: today(), Given_By: givenBy });
        setWorkerQuery("");
        setWorkerLocked(false);
        // Refresh distribution entries for updated stock calc
        fetchAll();
      } else {
        showAlert("error", data.message || t("hse.distribute.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.distribute.alerts.networkError"));
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Input style ───────────────────────────────────────────────
  const inp = "w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500";
  const locked = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-sm cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />
      <div className="p-6 max-w-4xl mx-auto">

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
        <div className="mb-8">
          <Link to="/hse" className="text-sm text-gray-400 hover:text-white transition mb-1 inline-block">
            ← {t("common.back")}
          </Link>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            {t("hse.distribute.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t("hse.distribute.subtitle")}</p>
        </div>

        {/* Access denied */}
        {!canDistribute ? (
          <div className="bg-red-900/30 border border-red-700 rounded-2xl p-8 text-center">
            <p className="text-red-300 text-lg font-semibold">🔒 {t("hse.distribute.accessDenied")}</p>
          </div>
        ) : loading ? (
          <p className="text-gray-400 text-sm">{t("common.loading")}</p>
        ) : (

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-orange-400">
              {t("hse.distribute.formTitle")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Date */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.distribute.fields.date")} *
                </label>
                <input
                  type="date"
                  className={inp}
                  value={form.Date}
                  onChange={(e) => setForm({ ...form, Date: e.target.value })}
                />
              </div>

              {/* Given By — locked */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.distribute.fields.givenBy")}
                </label>
                <input className={locked} value={givenBy} readOnly />
              </div>

              {/* Worker Name — autocomplete */}
              <div className="relative">
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.distribute.fields.workerName")} *
                </label>
                <div className="flex gap-2">
                  <input
                    className={inp}
                    value={workerQuery}
                    readOnly={workerLocked}
                    placeholder={t("hse.distribute.placeholders.workerName")}
                    onChange={(e) => {
                      setWorkerQuery(e.target.value);
                      setForm((f) => ({ ...f, Worker_Name: "", Worker_Position: "" }));
                    }}
                    onFocus={() => !workerLocked && setWorkerFocused(true)}
                    onBlur={() => setTimeout(() => setWorkerFocused(false), 150)}
                  />
                  {workerLocked && (
                    <button
                      onClick={clearWorker}
                      className="px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xs transition"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown list */}
                {workerFocused && !workerLocked && filteredWorkers.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                    {filteredWorkers.map((w) => (
                      <li
                        key={w.rowindex}
                        onMouseDown={() => selectWorker(w)}
                        className="px-4 py-2 text-sm text-white hover:bg-orange-700 cursor-pointer transition"
                      >
                        <span className="font-medium">{w.Full_Name}</span>
                        <span className="text-gray-400 text-xs ml-2">— {w.Position}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {workerFocused && !workerLocked && workerQuery && filteredWorkers.length === 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-400">
                    {t("hse.distribute.noWorkerFound")}
                  </div>
                )}
              </div>

              {/* Worker Position — auto-filled & locked */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.distribute.fields.workerPosition")}
                </label>
                <input className={locked} value={form.Worker_Position} readOnly />
              </div>

              {/* PPE Type */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.distribute.fields.ppeType")} *
                </label>
                <select
                  className={inp}
                  value={form.PPE_Type}
                  onChange={(e) => setForm({ ...form, PPE_Type: e.target.value, Size: "", Quantity: "" })}
                >
                  <option value="">{t("hse.distribute.placeholders.ppeType")}</option>
                  {ppeTypes.map((type) => {
                    const depleted = isTypeDepleted(type.Name);
                    return (
                      <option
                        key={type.rowindex}
                        value={type.Name}
                        disabled={depleted}
                        className={depleted ? "text-gray-500" : ""}
                      >
                        {type.Name}{depleted ? ` (${t("hse.distribute.outOfStock")})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Size — only if Has_Size = YES */}
              {selectedTypeHasSize && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    {t("hse.distribute.fields.size")} *
                  </label>
                  <select
                    className={inp}
                    value={form.Size}
                    onChange={(e) => setForm({ ...form, Size: e.target.value, Quantity: "" })}
                  >
                    <option value="">{t("hse.distribute.placeholders.size")}</option>
                    {availableSizes.map(({ size, qty }) => (
                      <option
                        key={size}
                        value={size}
                        disabled={qty <= 0}
                        className={qty <= 0 ? "text-gray-500" : ""}
                      >
                        {size}{qty <= 0 ? ` (${t("hse.distribute.outOfStock")})` : ` — ${t("hse.distribute.available")}: ${qty}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.distribute.fields.quantity")} *
                  {form.PPE_Type && (
                    <span className="ml-2 text-orange-400">
                      ({t("hse.distribute.available")}: {currentAvailable})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentAvailable}
                  className={inp}
                  value={form.Quantity}
                  onChange={(e) => setForm({ ...form, Quantity: e.target.value })}
                  placeholder="0"
                />
                {form.Quantity && Number(form.Quantity) > currentAvailable && (
                  <p className="text-red-400 text-xs mt-1">
                    ⚠️ {t("hse.distribute.alerts.exceedsStock", { max: currentAvailable })}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("hse.distribute.fields.notes")}
                </label>
                <input
                  className={inp}
                  value={form.Notes}
                  onChange={(e) => setForm({ ...form, Notes: e.target.value })}
                  placeholder={t("hse.distribute.placeholders.notes")}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold text-sm transition disabled:opacity-50 shadow-lg"
              >
                {submitLoading ? t("common.submitting") : t("hse.distribute.submitButton")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
