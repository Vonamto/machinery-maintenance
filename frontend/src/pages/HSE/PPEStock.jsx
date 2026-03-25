// frontend/src/pages/HSE/PPEStock.jsx

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { canUserPerformAction } from "@/config/roles";
import { ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

const emptyStockForm = { PPE_Type: "", Size: "", Quantity: "", Notes: "" };
const emptyTypeForm  = { Name: "", Has_Size: "NO", Category: "" };

// ── Status helpers ────────────────────────────────────────────
const getStatus = (available) => {
  if (available <= 0) return "out";
  if (available <= 5) return "low";
  return "good";
};

const STATUS_COLORS = {
  out:  {
    num:    "text-red-400",
    badge:  "bg-red-900/50 text-red-300",
    border: "border-red-700/60",
    bg:     "bg-red-950/40",
    rowBg:  "bg-red-900/10",
  },
  low:  {
    num:    "text-yellow-400",
    badge:  "bg-yellow-900/50 text-yellow-300",
    border: "border-yellow-700/60",
    bg:     "bg-yellow-950/30",
    rowBg:  "bg-yellow-900/10",
  },
  good: {
    num:    "text-green-400",
    badge:  "bg-green-900/50 text-green-300",
    border: "border-gray-700",
    bg:     "bg-gray-800/80",
    rowBg:  "",
  },
};

const STATUS_LABEL = (status, t) => {
  if (status === "out") return `🔴 ${t("hse.stock.summary.outOfStock")}`;
  if (status === "low") return `🟡 ${t("hse.stock.summary.lowStock")}`;
  return `🟢 ${t("hse.stock.summary.inStock")}`;
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];
const sortSizes = (a, b) => {
  const ai = SIZE_ORDER.indexOf(a.size.toUpperCase());
  const bi = SIZE_ORDER.indexOf(b.size.toUpperCase());
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  const an = parseFloat(a.size);
  const bn = parseFloat(b.size);
  if (!isNaN(an) && !isNaN(bn)) return an - bn;
  return a.size.localeCompare(b.size);
};

export default function PPEStock() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const role  = user?.role || "Guest";
  const token = localStorage.getItem("token");

  // ── Permissions ──────────────────────────────────────────────
  const canRestock     = canUserPerformAction(role, "HSE_STOCK_RESTOCK");
  const canEditStock   = canUserPerformAction(role, "HSE_STOCK_EDIT");
  const canDeleteStock = canUserPerformAction(role, "HSE_STOCK_DELETE");
  const canAddType     = canUserPerformAction(role, "HSE_TYPES_ADD");
  const canEditType    = canUserPerformAction(role, "HSE_TYPES_EDIT");
  const canDeleteType  = canUserPerformAction(role, "HSE_TYPES_DELETE");

  // ── Tabs ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("summary");

  // ── Stock state ───────────────────────────────────────────────
  const [stockEntries,     setStockEntries]     = useState([]);
  const [stockLoading,     setStockLoading]     = useState(true);
  const [showRestockForm,  setShowRestockForm]  = useState(false);
  const [restockForm,      setRestockForm]      = useState(emptyStockForm);
  const [restockLoading,   setRestockLoading]   = useState(false);
  const [editStockIndex,   setEditStockIndex]   = useState(null);
  const [editStockForm,    setEditStockForm]    = useState(emptyStockForm);
  const [editStockLoading, setEditStockLoading] = useState(false);
  const [stockSearch,      setStockSearch]      = useState("");

  // ── Distribution log ──────────────────────────────────────────
  const [distEntries, setDistEntries] = useState([]);

  // ── PPE Types state ───────────────────────────────────────────
  const [ppeTypes,        setPpeTypes]        = useState([]);
  const [typesLoading,    setTypesLoading]    = useState(true);
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);
  const [addTypeForm,     setAddTypeForm]     = useState(emptyTypeForm);
  const [addTypeLoading,  setAddTypeLoading]  = useState(false);
  const [editTypeIndex,   setEditTypeIndex]   = useState(null);
  const [editTypeForm,    setEditTypeForm]    = useState(emptyTypeForm);
  const [editTypeLoading, setEditTypeLoading] = useState(false);
  const [typeSearch,      setTypeSearch]      = useState("");

  // ── Summary filter ────────────────────────────────────────────
  const [summarySearch, setSummarySearch] = useState("");

  // ── Mobile expand ─────────────────────────────────────────────
  const [expandedStockIdx, setExpandedStockIdx] = useState(null);
  const [expandedTypeIdx,  setExpandedTypeIdx]  = useState(null);

  // ── Alert ─────────────────────────────────────────────────────
  const [alert, setAlert] = useState(null);
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // ── Helpers ───────────────────────────────────────────────────
  const today   = () => new Date().toISOString().split("T")[0];
  const addedBy = user?.full_name || user?.username || "";
  const typeHasSize = (typeName) =>
    ppeTypes.find((p) => p.Name === typeName)?.Has_Size === "YES";

  // ── Fetch all ─────────────────────────────────────────────────
  const fetchAll = async () => {
    setStockLoading(true);
    setTypesLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [s, p, d] = await Promise.all([
        fetch(`${API_BASE}/api/PPE_Stock`,            { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/PPE_Types`,            { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/PPE_Distribution_Log`, { headers }).then((r) => r.json()),
      ]);
      setStockEntries(Array.isArray(s) ? s : []);
      setPpeTypes    (Array.isArray(p) ? p : []);
      setDistEntries (Array.isArray(d) ? d : []);
    } catch {
      showAlert("error", t("hse.stock.alerts.networkError"));
    } finally {
      setStockLoading(false);
      setTypesLoading(false);
    }
  };

  const fetchStock = async () => {
    setStockLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [s, d] = await Promise.all([
        fetch(`${API_BASE}/api/PPE_Stock`,            { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/PPE_Distribution_Log`, { headers }).then((r) => r.json()),
      ]);
      setStockEntries(Array.isArray(s) ? s : []);
      setDistEntries (Array.isArray(d) ? d : []);
    } catch {
      showAlert("error", t("hse.stock.alerts.networkError"));
    } finally {
      setStockLoading(false);
    }
  };

  const fetchTypes = async () => {
    setTypesLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/PPE_Types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPpeTypes(Array.isArray(data) ? data : []);
    } catch {
      showAlert("error", t("hse.stock.alerts.networkError"));
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Grouped summary calculation ───────────────────────────────
  const groupedSummary = useMemo(() => {
    const now       = new Date();
    const thisMonth = now.getMonth();
    const thisYear  = now.getFullYear();
    const map = {};

    stockEntries.forEach((e) => {
      const type = e.PPE_Type;
      const size = e.Size || "";
      if (!map[type]) map[type] = {};
      if (!map[type][size]) map[type][size] = { restocked: 0, distributed: 0, distributedThisMonth: 0 };
      map[type][size].restocked += Number(e.Quantity || 0);
    });

    distEntries.forEach((e) => {
      const type = e.PPE_Type;
      const size = e.Size || "";
      if (!map[type]) map[type] = {};
      if (!map[type][size]) map[type][size] = { restocked: 0, distributed: 0, distributedThisMonth: 0 };
      map[type][size].distributed += Number(e.Quantity || 0);
      const d = new Date(e.Date || e.date || "");
      if (!isNaN(d) && d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        map[type][size].distributedThisMonth += Number(e.Quantity || 0);
      }
    });

    return Object.entries(map)
      .map(([ppeType, sizeMap]) => {
        const entries = Object.entries(sizeMap).map(([size, data]) => ({
          size,
          available: data.restocked - data.distributed,
          distributedThisMonth: data.distributedThisMonth,
        }));

        const hasSize = entries.some((s) => s.size !== "");
        const totalDistributedThisMonth = entries.reduce((a, s) => a + s.distributedThisMonth, 0);

        if (!hasSize) {
          const row = entries[0] || { available: 0, distributedThisMonth: 0 };
          return {
            PPE_Type: ppeType,
            hasSize: false,
            available: row.available,
            distributedThisMonth: row.distributedThisMonth,
          };
        }

        const sortedSizes = entries.filter((s) => s.size !== "").sort(sortSizes);
        const overallStatus = sortedSizes.some((s) => s.available <= 0)
          ? "out"
          : sortedSizes.some((s) => s.available <= 5)
          ? "low"
          : "good";

        return {
          PPE_Type: ppeType,
          hasSize: true,
          sizes: sortedSizes,
          overallStatus,
          totalDistributedThisMonth,
        };
      })
      .sort((a, b) => a.PPE_Type.localeCompare(b.PPE_Type));
  }, [stockEntries, distEntries]);

  const filteredGrouped = groupedSummary.filter((r) =>
    (r.PPE_Type || "").toLowerCase().includes(summarySearch.toLowerCase())
  );

  // ── Restock ───────────────────────────────────────────────────
  const handleRestock = async () => {
    if (!restockForm.PPE_Type || !restockForm.Quantity) {
      showAlert("error", t("hse.stock.alerts.missingFields")); return;
    }
    setRestockLoading(true);
    try {
      const payload = {
        PPE_Type:     restockForm.PPE_Type,
        Size:         typeHasSize(restockForm.PPE_Type) ? restockForm.Size : "",
        Quantity:     restockForm.Quantity,
        Last_Updated: today(),
        Added_by:     addedBy,
        Notes:        restockForm.Notes,
      };
      const res  = await fetch(`${API_BASE}/api/add/PPE_Stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.stock.alerts.restockSuccess"));
        setRestockForm(emptyStockForm);
        setShowRestockForm(false);
        fetchStock();
      } else {
        showAlert("error", data.message || t("hse.stock.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.stock.alerts.networkError"));
    } finally {
      setRestockLoading(false);
    }
  };

  // ── Edit stock ────────────────────────────────────────────────
  const startEditStock = (entry) => {
    setEditStockIndex(entry.rowindex);
    setEditStockForm({
      PPE_Type: entry.PPE_Type || "",
      Size:     entry.Size     || "",
      Quantity: entry.Quantity || "",
      Notes:    entry.Notes    || "",
    });
  };

  const handleSaveEditStock = async () => {
    if (!editStockForm.PPE_Type || !editStockForm.Quantity) {
      showAlert("error", t("hse.stock.alerts.missingFields")); return;
    }
    setEditStockLoading(true);
    try {
      const payload = { ...editStockForm, Last_Updated: today(), Added_by: addedBy };
      const res  = await fetch(`${API_BASE}/api/edit/PPE_Stock/${editStockIndex}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.stock.alerts.editSuccess"));
        setEditStockIndex(null);
        fetchStock();
      } else {
        showAlert("error", data.message || t("hse.stock.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.stock.alerts.networkError"));
    } finally {
      setEditStockLoading(false);
    }
  };

  const handleDeleteStock = async (entry) => {
    if (!window.confirm(t("hse.stock.alerts.deleteConfirm", { type: entry.PPE_Type }))) return;
    try {
      const res  = await fetch(`${API_BASE}/api/delete/PPE_Stock/${entry.rowindex}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.stock.alerts.deleteSuccess"));
        fetchStock();
      } else {
        showAlert("error", data.message || t("hse.stock.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.stock.alerts.networkError"));
    }
  };

  // ── PPE Types CRUD ────────────────────────────────────────────
  const handleAddType = async () => {
    if (!addTypeForm.Name.trim()) {
      showAlert("error", t("hse.stock.alerts.missingTypeName")); return;
    }
    setAddTypeLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/add/PPE_Types`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(addTypeForm),
      });
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.stock.alerts.typeAddSuccess"));
        setAddTypeForm(emptyTypeForm);
        setShowAddTypeForm(false);
        fetchTypes();
      } else {
        showAlert("error", data.message || t("hse.stock.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.stock.alerts.networkError"));
    } finally {
      setAddTypeLoading(false);
    }
  };

  const startEditType = (type) => {
    setEditTypeIndex(type.rowindex);
    setEditTypeForm({
      Name:     type.Name     || "",
      Has_Size: type.Has_Size || "NO",
      Category: type.Category || "",
    });
  };

  const handleSaveEditType = async () => {
    if (!editTypeForm.Name.trim()) {
      showAlert("error", t("hse.stock.alerts.missingTypeName")); return;
    }
    setEditTypeLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/edit/PPE_Types/${editTypeIndex}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editTypeForm),
      });
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.stock.alerts.typeEditSuccess"));
        setEditTypeIndex(null);
        fetchTypes();
      } else {
        showAlert("error", data.message || t("hse.stock.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.stock.alerts.networkError"));
    } finally {
      setEditTypeLoading(false);
    }
  };

  const handleDeleteType = async (type) => {
    if (!window.confirm(t("hse.stock.alerts.typeDeleteConfirm", { name: type.Name }))) return;
    try {
      const res  = await fetch(`${API_BASE}/api/delete/PPE_Types/${type.rowindex}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        showAlert("success", t("hse.stock.alerts.typeDeleteSuccess"));
        fetchTypes();
      } else {
        showAlert("error", data.message || t("hse.stock.alerts.error"));
      }
    } catch {
      showAlert("error", t("hse.stock.alerts.networkError"));
    }
  };

  // ── Filtered lists ────────────────────────────────────────────
  const filteredStock = stockEntries.filter((s) => {
    const q = stockSearch.toLowerCase();
    return (
      (s.PPE_Type || "").toLowerCase().includes(q) ||
      (s.Size     || "").toLowerCase().includes(q) ||
      (s.Added_by || "").toLowerCase().includes(q)
    );
  });

  const filteredTypes = ppeTypes.filter((p) => {
    const q = typeSearch.toLowerCase();
    return (
      (p.Name     || "").toLowerCase().includes(q) ||
      (p.Category || "").toLowerCase().includes(q)
    );
  });

  // ── Shared input style ────────────────────────────────────────
  const inp = "w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />
      <div className="p-6 max-w-6xl mx-auto">

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
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            {t("hse.stock.title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t("hse.stock.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          {["summary", "stock", "types"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition ${
                activeTab === tab
                  ? "bg-yellow-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t(`hse.stock.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* ══════════ SUMMARY TAB ══════════ */}
        {activeTab === "summary" && (
          <div>
            <div className="mb-5">
              <input
                className="w-full sm:w-72 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                placeholder={t("hse.stock.summarySearchPlaceholder")}
                value={summarySearch}
                onChange={(e) => setSummarySearch(e.target.value)}
              />
            </div>

            {stockLoading ? (
              <p className="text-gray-400 text-sm">{t("common.loading")}</p>
            ) : filteredGrouped.length === 0 ? (
              <p className="text-gray-400 text-sm">{t("hse.stock.noResults")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGrouped.map((group, idx) => {
                  if (!group.hasSize) {
                    const st = getStatus(group.available);
                    const c  = STATUS_COLORS[st];
                    return (
                      <div key={idx} className={`border rounded-2xl p-5 flex flex-col gap-3 ${c.bg} ${c.border}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-white text-sm leading-tight">{group.PPE_Type}</p>
                          <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-bold ${c.badge}`}>
                            {STATUS_LABEL(st, t)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">{t("hse.stock.summary.table.available")}</p>
                          <p className={`text-4xl font-bold leading-none ${c.num}`}>{group.available}</p>
                        </div>
                        <div className="border-t border-gray-700/60 pt-3">
                          <p className="text-xs text-gray-400">{t("hse.stock.summary.table.distributed")}</p>
                          <p className="text-xl font-semibold text-orange-400">{group.distributedThisMonth}</p>
                        </div>
                      </div>
                    );
                  }

                  const oc = STATUS_COLORS[group.overallStatus];
                  return (
                    <div key={idx} className={`border rounded-2xl p-5 flex flex-col gap-3 ${oc.bg} ${oc.border}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-white text-sm leading-tight">{group.PPE_Type}</p>
                        <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-bold ${oc.badge}`}>
                          {STATUS_LABEL(group.overallStatus, t)}
                        </span>
                      </div>
                      <div className="flex flex-col divide-y divide-gray-700/50">
                        {group.sizes.map((sizeRow) => {
                          const st = getStatus(sizeRow.available);
                          const sc = STATUS_COLORS[st];
                          return (
                            <div key={sizeRow.size} className={`flex items-center justify-between py-2 px-1 rounded ${sc.rowBg}`}>
                              <span className="text-sm font-bold text-gray-200 w-10 shrink-0">{sizeRow.size}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400">{t("hse.stock.summary.table.available")}:</span>
                                <span className={`text-lg font-bold ${sc.num}`}>{sizeRow.available}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sc.badge}`}>
                                {st === "out" ? "🔴" : st === "low" ? "🟡" : "🟢"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t border-gray-700/60 pt-3">
                        <p className="text-xs text-gray-400">{t("hse.stock.summary.table.distributed")}</p>
                        <p className="text-xl font-semibold text-orange-400">{group.totalDistributedThisMonth}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ STOCK TAB ══════════ */}
        {activeTab === "stock" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <input
                className="w-full sm:w-72 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                placeholder={t("hse.stock.searchPlaceholder")}
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
              {canRestock && (
                <button
                  onClick={() => { setShowRestockForm(!showRestockForm); setRestockForm(emptyStockForm); }}
                  className="px-5 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-sm transition"
                >
                  {showRestockForm ? t("common.cancel") : `+ ${t("hse.stock.restockButton")}`}
                </button>
              )}
            </div>

            {/* Restock Form */}
            {canRestock && showRestockForm && (
              <div className="mb-6 bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-yellow-400 mb-4">
                  {t("hse.stock.restockForm.title")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.ppeType")} *</label>
                    <select
                      className={inp}
                      value={restockForm.PPE_Type}
                      onChange={(e) => setRestockForm({ ...restockForm, PPE_Type: e.target.value, Size: "" })}
                    >
                      <option value="">{t("hse.stock.placeholders.selectType")}</option>
                      {ppeTypes.map((type) => (
                        <option key={type.rowindex} value={type.Name}>{type.Name}</option>
                      ))}
                    </select>
                  </div>
                  {typeHasSize(restockForm.PPE_Type) && (
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.size")}</label>
                      <input
                        className={inp}
                        value={restockForm.Size}
                        onChange={(e) => setRestockForm({ ...restockForm, Size: e.target.value })}
                        placeholder={t("hse.stock.placeholders.size")}
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.quantity")} *</label>
                    <input
                      type="number" min="1" className={inp}
                      value={restockForm.Quantity}
                      onChange={(e) => setRestockForm({ ...restockForm, Quantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.notes")}</label>
                    <input
                      className={inp}
                      value={restockForm.Notes}
                      onChange={(e) => setRestockForm({ ...restockForm, Notes: e.target.value })}
                      placeholder={t("hse.stock.placeholders.notes")}
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-6 text-xs text-gray-500">
                  <span>{t("hse.stock.fields.lastUpdated")}: <span className="text-gray-300">{today()}</span></span>
                  <span>{t("hse.stock.fields.addedBy")}: <span className="text-gray-300">{addedBy}</span></span>
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={handleRestock} disabled={restockLoading}
                    className="px-5 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold transition disabled:opacity-50">
                    {restockLoading ? t("common.submitting") : t("hse.stock.restockForm.submit")}
                  </button>
                  <button onClick={() => setShowRestockForm(false)}
                    className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition">
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}

            {stockLoading ? (
              <p className="text-gray-400 text-sm">{t("common.loading")}</p>
            ) : filteredStock.length === 0 ? (
              <p className="text-gray-400 text-sm">{t("hse.stock.noResults")}</p>
            ) : (
              <>
                {/* ════ MOBILE CARDS ════ */}
                <div className="md:hidden space-y-3">
                  {filteredStock.map((entry, idx) => {
                    const isEditing  = editStockIndex === entry.rowindex;
                    const isExpanded = expandedStockIdx === idx;

                    // ── Edit card ──
                    if (isEditing) {
                      return (
                        <div key={entry.rowindex} className="bg-gray-800 border border-yellow-600 rounded-2xl p-4 space-y-3">
                          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                            {t("common.edit")} #{idx + 1}
                          </p>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.ppeType")}</label>
                            <select className={inp} value={editStockForm.PPE_Type}
                              onChange={(e) => setEditStockForm({ ...editStockForm, PPE_Type: e.target.value, Size: "" })}>
                              {ppeTypes.map((type) => (
                                <option key={type.rowindex} value={type.Name}>{type.Name}</option>
                              ))}
                            </select>
                          </div>
                          {typeHasSize(editStockForm.PPE_Type) && (
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.size")}</label>
                              <input className={inp} value={editStockForm.Size}
                                onChange={(e) => setEditStockForm({ ...editStockForm, Size: e.target.value })} />
                            </div>
                          )}
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.quantity")}</label>
                            <input type="number" min="1" className={inp} value={editStockForm.Quantity}
                              onChange={(e) => setEditStockForm({ ...editStockForm, Quantity: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.notes")}</label>
                            <input className={inp} value={editStockForm.Notes}
                              onChange={(e) => setEditStockForm({ ...editStockForm, Notes: e.target.value })} />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={handleSaveEditStock} disabled={editStockLoading}
                              className="flex-1 px-3 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition disabled:opacity-50">
                              {editStockLoading ? t("common.submitting") : t("common.submit")}
                            </button>
                            <button onClick={() => setEditStockIndex(null)}
                              className="flex-1 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xs transition">
                              {t("common.cancel")}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // ── Normal card ──
                    return (
                      <div key={entry.rowindex} className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 shadow-lg">
                        <button
                          onClick={() => setExpandedStockIdx(isExpanded ? null : idx)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-base font-semibold text-yellow-400 leading-tight">{entry.PPE_Type}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-300 text-xs font-bold">
                                × {entry.Quantity}
                              </span>
                              {isExpanded
                                ? <ChevronUp size={16} className="text-gray-400" />
                                : <ChevronDown size={16} className="text-gray-400" />}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {entry.Size && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 text-xs font-bold">
                                {entry.Size}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{entry.Last_Updated}</span>
                          </div>
                        </button>

                        {isExpanded && (
                          <>
                            <div className="mt-3 pt-3 border-t border-gray-700 space-y-1 text-sm">
                              <p>
                                <span className="text-gray-400">{t("hse.stock.table.addedBy")}: </span>
                                <span className="text-gray-200">{entry.Added_by || "—"}</span>
                              </p>
                              <p>
                                <span className="text-gray-400">{t("hse.stock.table.notes")}: </span>
                                <span className="text-gray-200">{entry.Notes || "—"}</span>
                              </p>
                            </div>
                            {(canEditStock || canDeleteStock) && (
                              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700/60">
                                {canEditStock && (
                                  <button onClick={() => startEditStock(entry)}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition">
                                    {t("common.edit")}
                                  </button>
                                )}
                                {canDeleteStock && (
                                  <button onClick={() => handleDeleteStock(entry)}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition">
                                    {t("common.delete")}
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ════ DESKTOP TABLE ════ */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-700">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">{t("hse.stock.table.ppeType")}</th>
                        <th className="px-4 py-3">{t("hse.stock.table.size")}</th>
                        <th className="px-4 py-3">{t("hse.stock.table.quantity")}</th>
                        <th className="px-4 py-3">{t("hse.stock.table.lastUpdated")}</th>
                        <th className="px-4 py-3">{t("hse.stock.table.addedBy")}</th>
                        <th className="px-4 py-3">{t("hse.stock.table.notes")}</th>
                        {(canEditStock || canDeleteStock) && (
                          <th className="px-4 py-3">{t("common.actions")}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStock.map((entry, idx) =>
                        editStockIndex === entry.rowindex ? (
                          <tr key={entry.rowindex} className="bg-gray-700 border-t border-gray-600">
                            <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <select className={inp} value={editStockForm.PPE_Type}
                                onChange={(e) => setEditStockForm({ ...editStockForm, PPE_Type: e.target.value, Size: "" })}>
                                {ppeTypes.map((type) => (
                                  <option key={type.rowindex} value={type.Name}>{type.Name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              {typeHasSize(editStockForm.PPE_Type) ? (
                                <input className={inp} value={editStockForm.Size}
                                  onChange={(e) => setEditStockForm({ ...editStockForm, Size: e.target.value })} />
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <input type="number" min="1" className={inp} value={editStockForm.Quantity}
                                onChange={(e) => setEditStockForm({ ...editStockForm, Quantity: e.target.value })} />
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{today()}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{addedBy}</td>
                            <td className="px-4 py-3">
                              <input className={inp} value={editStockForm.Notes}
                                onChange={(e) => setEditStockForm({ ...editStockForm, Notes: e.target.value })} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={handleSaveEditStock} disabled={editStockLoading}
                                  className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition disabled:opacity-50">
                                  {editStockLoading ? t("common.submitting") : t("common.submit")}
                                </button>
                                <button onClick={() => setEditStockIndex(null)}
                                  className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs transition">
                                  {t("common.cancel")}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={entry.rowindex} className="border-t border-gray-700 hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium">{entry.PPE_Type}</td>
                            <td className="px-4 py-3 text-gray-300">{entry.Size || "—"}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full bg-yellow-900/50 text-yellow-300 text-xs font-bold">
                                {entry.Quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{entry.Last_Updated}</td>
                            <td className="px-4 py-3 text-gray-300 text-xs">{entry.Added_by}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{entry.Notes || "—"}</td>
                            {(canEditStock || canDeleteStock) && (
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  {canEditStock && (
                                    <button onClick={() => startEditStock(entry)}
                                      className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition">
                                      {t("common.edit")}
                                    </button>
                                  )}
                                  {canDeleteStock && (
                                    <button onClick={() => handleDeleteStock(entry)}
                                      className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition">
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
              </>
            )}
          </div>
        )}

        {/* ══════════ TYPES TAB ══════════ */}
        {activeTab === "types" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <input
                className="w-full sm:w-72 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                placeholder={t("hse.stock.typeSearchPlaceholder")}
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
              />
              {canAddType && (
                <button
                  onClick={() => { setShowAddTypeForm(!showAddTypeForm); setAddTypeForm(emptyTypeForm); }}
                  className="px-5 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-sm transition"
                >
                  {showAddTypeForm ? t("common.cancel") : `+ ${t("hse.stock.addTypeButton")}`}
                </button>
              )}
            </div>

            {/* Add Type Form */}
            {canAddType && showAddTypeForm && (
              <div className="mb-6 bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-yellow-400 mb-4">
                  {t("hse.stock.addTypeForm.title")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.typeName")} *</label>
                    <input className={inp} value={addTypeForm.Name}
                      onChange={(e) => setAddTypeForm({ ...addTypeForm, Name: e.target.value })}
                      placeholder={t("hse.stock.placeholders.typeName")} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.hasSize")}</label>
                    <select className={inp} value={addTypeForm.Has_Size}
                      onChange={(e) => setAddTypeForm({ ...addTypeForm, Has_Size: e.target.value })}>
                      <option value="NO">NO</option>
                      <option value="YES">YES</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.category")}</label>
                    <input className={inp} value={addTypeForm.Category}
                      onChange={(e) => setAddTypeForm({ ...addTypeForm, Category: e.target.value })}
                      placeholder={t("hse.stock.placeholders.category")} />
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={handleAddType} disabled={addTypeLoading}
                    className="px-5 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold transition disabled:opacity-50">
                    {addTypeLoading ? t("common.submitting") : t("hse.stock.addTypeForm.submit")}
                  </button>
                  <button onClick={() => setShowAddTypeForm(false)}
                    className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition">
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}

            {typesLoading ? (
              <p className="text-gray-400 text-sm">{t("common.loading")}</p>
            ) : filteredTypes.length === 0 ? (
              <p className="text-gray-400 text-sm">{t("hse.stock.noTypeResults")}</p>
            ) : (
              <>
                {/* ════ MOBILE CARDS ════ */}
                <div className="md:hidden space-y-3">
                  {filteredTypes.map((type, idx) => {
                    const isEditing  = editTypeIndex === type.rowindex;
                    const isExpanded = expandedTypeIdx === idx;

                    // ── Edit card ──
                    if (isEditing) {
                      return (
                        <div key={type.rowindex} className="bg-gray-800 border border-yellow-600 rounded-2xl p-4 space-y-3">
                          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                            {t("common.edit")} #{idx + 1}
                          </p>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.typeName")}</label>
                            <input className={inp} value={editTypeForm.Name}
                              onChange={(e) => setEditTypeForm({ ...editTypeForm, Name: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.hasSize")}</label>
                            <select className={inp} value={editTypeForm.Has_Size}
                              onChange={(e) => setEditTypeForm({ ...editTypeForm, Has_Size: e.target.value })}>
                              <option value="NO">NO</option>
                              <option value="YES">YES</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t("hse.stock.fields.category")}</label>
                            <input className={inp} value={editTypeForm.Category}
                              onChange={(e) => setEditTypeForm({ ...editTypeForm, Category: e.target.value })} />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={handleSaveEditType} disabled={editTypeLoading}
                              className="flex-1 px-3 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition disabled:opacity-50">
                              {editTypeLoading ? t("common.submitting") : t("common.submit")}
                            </button>
                            <button onClick={() => setEditTypeIndex(null)}
                              className="flex-1 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xs transition">
                              {t("common.cancel")}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // ── Normal card ──
                    return (
                      <div key={type.rowindex} className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 shadow-lg">
                        <button
                          onClick={() => setExpandedTypeIdx(isExpanded ? null : idx)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-base font-semibold text-yellow-400 leading-tight">{type.Name}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                type.Has_Size === "YES"
                                  ? "bg-blue-900/50 text-blue-300"
                                  : "bg-gray-700 text-gray-400"
                              }`}>
                                {type.Has_Size}
                              </span>
                              {isExpanded
                                ? <ChevronUp size={16} className="text-gray-400" />
                                : <ChevronDown size={16} className="text-gray-400" />}
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <>
                            <div className="mt-3 pt-3 border-t border-gray-700 space-y-1 text-sm">
                              <p>
                                <span className="text-gray-400">{t("hse.stock.table.category")}: </span>
                                <span className="text-gray-200">{type.Category || "—"}</span>
                              </p>
                            </div>
                            {(canEditType || canDeleteType) && (
                              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700/60">
                                {canEditType && (
                                  <button onClick={() => startEditType(type)}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition">
                                    {t("common.edit")}
                                  </button>
                                )}
                                {canDeleteType && (
                                  <button onClick={() => handleDeleteType(type)}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition">
                                    {t("common.delete")}
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ════ DESKTOP TABLE ════ */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-700">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">{t("hse.stock.table.typeName")}</th>
                        <th className="px-4 py-3">{t("hse.stock.table.hasSize")}</th>
                        <th className="px-4 py-3">{t("hse.stock.table.category")}</th>
                        {(canEditType || canDeleteType) && (
                          <th className="px-4 py-3">{t("common.actions")}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTypes.map((type, idx) =>
                        editTypeIndex === type.rowindex ? (
                          <tr key={type.rowindex} className="bg-gray-700 border-t border-gray-600">
                            <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <input className={inp} value={editTypeForm.Name}
                                onChange={(e) => setEditTypeForm({ ...editTypeForm, Name: e.target.value })} />
                            </td>
                            <td className="px-4 py-3">
                              <select className={inp} value={editTypeForm.Has_Size}
                                onChange={(e) => setEditTypeForm({ ...editTypeForm, Has_Size: e.target.value })}>
                                <option value="NO">NO</option>
                                <option value="YES">YES</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input className={inp} value={editTypeForm.Category}
                                onChange={(e) => setEditTypeForm({ ...editTypeForm, Category: e.target.value })} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={handleSaveEditType} disabled={editTypeLoading}
                                  className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition disabled:opacity-50">
                                  {editTypeLoading ? t("common.submitting") : t("common.submit")}
                                </button>
                                <button onClick={() => setEditTypeIndex(null)}
                                  className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs transition">
                                  {t("common.cancel")}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={type.rowindex} className="border-t border-gray-700 hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium">{type.Name}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                type.Has_Size === "YES"
                                  ? "bg-blue-900/50 text-blue-300"
                                  : "bg-gray-700 text-gray-400"
                              }`}>
                                {type.Has_Size}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-300">{type.Category || "—"}</td>
                            {(canEditType || canDeleteType) && (
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  {canEditType && (
                                    <button onClick={() => startEditType(type)}
                                      className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition">
                                      {t("common.edit")}
                                    </button>
                                  )}
                                  {canDeleteType && (
                                    <button onClick={() => handleDeleteType(type)}
                                      className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition">
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
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
