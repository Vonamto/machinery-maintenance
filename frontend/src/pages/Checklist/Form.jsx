import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Camera,
  Loader2
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import { useTranslation } from "react-i18next";
import { getChecklistTemplate } from "@/config/checklistTemplates";

export default function ChecklistForm() {
  const { user } = useAuth();
  const { refreshCache } = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* ---------------- STATE ---------------- */
  const [loading, setLoading] = useState(true);
  const [equipmentList, setEquipmentList] = useState([]);
  const [usernamesList, setUsernamesList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split("T")[0],
    "Full Name": user?.full_name || "",
    "Model / Type": "",
    "Plate Number": "",
    "Equipment Type": ""
  });

  const [checklistData, setChecklistData] = useState({});

  const isDriver = user?.role === "Driver";
  const isSupervisorOrMechanic =
    user?.role === "Supervisor" || user?.role === "Mechanic";

  /* ---------------- INITIAL DATA FETCH (SPINNER) ---------------- */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Refresh cache on every load to ensure fresh data (Logic from Maintenance/Form.jsx)
        const [freshEquipment, freshUsers] = await Promise.all([
          refreshCache("Equipment_List"),
          refreshCache("Users")
        ]);
        setEquipmentList(freshEquipment || []);
        setUsernamesList(freshUsers || []);
      } catch (error) {
        console.error("Error refreshing checklist data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  /* ---------------- ACCESS CONTROL ---------------- */
  useEffect(() => {
    if (user?.role === "Cleaning Guy") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* ---------------- DRIVER AUTO-FILL & LOCK ---------------- */
  useEffect(() => {
    if (!isDriver || !equipmentList.length) return;

    const assigned = equipmentList.find(
      e =>
        e["Driver 1"] === user.full_name ||
        e["Driver 2"] === user.full_name
    );

    if (assigned) {
      setFormData(prev => ({
        ...prev,
        "Model / Type": assigned["Model / Type"],
        "Plate Number": assigned["Plate Number"],
        "Equipment Type": assigned["Equipment Type"]
      }));
    }
  }, [isDriver, equipmentList, user]);

  /* ---------------- SUPERVISOR/MECHANIC LINKED LOGIC ---------------- */
  
  // 1. Dynamic Drivers List
  const availableDrivers = useMemo(() => {
    if (!isSupervisorOrMechanic) return [];
    // If a plate is selected, only show the 1 or 2 drivers assigned to it
    if (formData["Plate Number"]) {
      const machine = equipmentList.find(e => e["Plate Number"] === formData["Plate Number"]);
      if (machine) {
        const d1 = machine["Driver 1"];
        const d2 = machine["Driver 2"];
        return usernamesList.filter(u => u.Name === d1 || u.Name === d2);
      }
    }
    // Otherwise show all drivers
    return usernamesList.filter(u => u.Role === "Driver" || u.Role === "Supervisor" || u.Role === "Mechanic");
  }, [isSupervisorOrMechanic, formData["Plate Number"], equipmentList, usernamesList]);

  // 2. Dynamic Plate Options
  const plateOptions = useMemo(() => {
    if (isDriver) return [];
    let filtered = equipmentList;
    
    // If Driver is selected, filter plates assigned to them
    if (formData["Full Name"] && isSupervisorOrMechanic) {
       filtered = filtered.filter(e => 
        e["Driver 1"] === formData["Full Name"] || e["Driver 2"] === formData["Full Name"]
       );
    }
    
    // If Model is selected, filter by model
    if (formData["Model / Type"]) {
      filtered = filtered.filter(e => e["Model / Type"] === formData["Model / Type"]);
    }

    return [...new Set(filtered.map(e => e["Plate Number"]))];
  }, [equipmentList, formData["Full Name"], formData["Model / Type"], isDriver, isSupervisorOrMechanic]);

  // 3. Dynamic Model Options
  const modelOptions = useMemo(() => {
    if (isDriver) return [];
    let filtered = equipmentList;
    if (formData["Full Name"]) {
      filtered = filtered.filter(e => e["Driver 1"] === formData["Full Name"] || e["Driver 2"] === formData["Full Name"]);
    }
    return [...new Set(filtered.map(e => e["Model / Type"]))];
  }, [equipmentList, formData["Full Name"], isDriver]);

  /* ---------------- AUTO-SET DATA ON PLATE CHANGE ---------------- */
  const handlePlateChange = (plate) => {
    const found = equipmentList.find(e => e["Plate Number"] === plate);
    if (found) {
      setFormData(prev => ({
        ...prev,
        "Plate Number": plate,
        "Model / Type": found["Model / Type"],
        "Equipment Type": found["Equipment Type"]
      }));
    } else {
      setFormData(prev => ({ ...prev, "Plate Number": plate }));
    }
  };

  /* ---------------- INIT CHECKLIST ---------------- */
  useEffect(() => {
    if (!formData["Equipment Type"]) return;

    const template = getChecklistTemplate(formData["Equipment Type"]);
    if (!template || !template.length) return;

    const initial = {};
    template.forEach(section => {
      section.items.forEach(item => {
        const key = `${section.sectionKey}.${item.key}`;
        initial[key] = { status: null, comment: "", photo: "" };
      });
    });

    setChecklistData(initial);
  }, [formData["Equipment Type"]]);

  /* ---------------- HANDLERS ---------------- */
  const handleStatusChange = (key, status) => {
    setChecklistData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        comment: status === "OK" ? "" : prev[key].comment
      }
    }));
  };

  const handleCommentChange = (key, value) => {
    setChecklistData(prev => ({
      ...prev,
      [key]: { ...prev[key], comment: value }
    }));
  };

  const handlePhotoUpload = (key, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setChecklistData(prev => ({
        ...prev,
        [key]: { ...prev[key], photo: reader.result }
      }));
    };
    reader.readAsDataURL(file);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async e => {
    e.preventDefault();

    if (Object.values(checklistData).some(i => i.status === null)) {
      alert(t("checklist.form.alerts.uncheckedItems"));
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        Role: user.role,
        Timestamp: new Date().toISOString(),
        "Checklist Data": JSON.stringify(checklistData)
      };

      const res = await fetchWithAuth("/api/add/Checklist_Log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.status === "success") {
        alert(t("checklist.form.alerts.success"));
        navigate("/checklist");
      } else {
        alert(t("checklist.form.alerts.error"));
      }
    } catch {
      alert(t("checklist.form.alerts.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  const template = getChecklistTemplate(formData["Equipment Type"]);

  /* ---------------- RENDER ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-cyan-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-medium">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 mb-6"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        {/* BASIC INFO */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-cyan-400 font-semibold mb-4">
            {t("checklist.form.basicInfo")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Field - Locked for Driver */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 px-1">{t("form.date") || "Date"}</label>
                <input
                    type="date"
                    value={formData.Date}
                    disabled={isDriver}
                    onChange={e => setFormData(prev => ({ ...prev, Date: e.target.value }))}
                    className="p-3 rounded-xl bg-gray-900/70 border border-gray-700 disabled:opacity-50"
                />
            </div>

            {/* Full Name / Driver Field */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 px-1">{t("form.driver") || "Driver Name"}</label>
                {isSupervisorOrMechanic ? (
                <select
                    value={formData["Full Name"]}
                    onChange={e => setFormData(prev => ({ ...prev, "Full Name": e.target.value }))}
                    className="p-3 rounded-xl bg-gray-900/70 border border-gray-700"
                >
                    <option value="">{t("checklist.form.chooseInspector")}</option>
                    {availableDrivers.map(u => (
                    <option key={u.Name} value={u.Name}>{u.Name}</option>
                    ))}
                </select>
                ) : (
                <input
                    value={formData["Full Name"]}
                    disabled
                    className="p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
                />
                )}
            </div>

            {/* Model Field */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 px-1">{t("form.model") || "Model"}</label>
                {isSupervisorOrMechanic ? (
                <select
                    value={formData["Model / Type"]}
                    onChange={e => setFormData(prev => ({ ...prev, "Model / Type": e.target.value, "Plate Number": "" }))}
                    className="p-3 rounded-xl bg-gray-900/70 border border-gray-700"
                >
                    <option value="">{t("checklist.form.chooseModel")}</option>
                    {modelOptions.map(m => (
                    <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                ) : (
                <input
                    value={formData["Model / Type"]}
                    disabled
                    className="p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
                />
                )}
            </div>

            {/* Plate Number Field */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 px-1">{t("form.plate") || "Plate Number"}</label>
                {isSupervisorOrMechanic ? (
                <select
                    value={formData["Plate Number"]}
                    onChange={e => handlePlateChange(e.target.value)}
                    className="p-3 rounded-xl bg-gray-900/70 border border-gray-700"
                >
                    <option value="">{t("checklist.form.choosePlate")}</option>
                    {plateOptions.map(p => (
                    <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                ) : (
                <input
                    value={formData["Plate Number"]}
                    disabled
                    className="p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
                />
                )}
            </div>
          </div>
        </div>

        {/* CHECKLIST SECTION */}
        {formData["Equipment Type"] ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {template.map(section => (
              <div
                key={section.sectionKey}
                className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
              >
                <h3 className="text-cyan-300 mb-4">
                  {t(section.titleKey)}
                </h3>

                {section.items.map(item => {
                  const key = `${section.sectionKey}.${item.key}`;
                  const state = checklistData[key];

                  return (
                    <div
                      key={key}
                      className="p-3 bg-gray-900/30 rounded-lg border border-gray-700 mb-3"
                    >
                      <div className="flex justify-between items-center">
                        <span>{t(`checklist.items.${item.key}`)}</span>
                        <div className="flex gap-2">
                          <CheckCircle
                            size={18}
                            onClick={() => handleStatusChange(key, "OK")}
                            className={`cursor-pointer transition-colors ${state?.status === "OK" ? "text-emerald-400" : "text-gray-500"}`}
                          />
                          <AlertTriangle
                            size={18}
                            onClick={() => handleStatusChange(key, "Warning")}
                            className={`cursor-pointer transition-colors ${state?.status === "Warning" ? "text-amber-400" : "text-gray-500"}`}
                          />
                          <XCircle
                            size={18}
                            onClick={() => handleStatusChange(key, "Fail")}
                            className={`cursor-pointer transition-colors ${state?.status === "Fail" ? "text-red-400" : "text-gray-500"}`}
                          />
                        </div>
                      </div>

                      {(state?.status === "Warning" || state?.status === "Fail") && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={state.comment}
                            onChange={e => handleCommentChange(key, e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-sm"
                            placeholder={t("checklist.form.commentPlaceholder")}
                          />

                          <label className="flex items-center gap-2 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300">
                            <Camera size={14} />
                            {t("checklist.form.uploadPhoto")}
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={e =>
                                e.target.files &&
                                handlePhotoUpload(key, e.target.files[0])
                              }
                            />
                          </label>

                          {state.photo && (
                            <img
                              src={state.photo}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-600 mt-2"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 font-bold hover:shadow-lg hover:shadow-emerald-900/20 transition-all disabled:opacity-50"
            >
              {submitting ? t("common.submitting") : t("common.submit")}
            </button>
          </form>
        ) : (
          <div className="text-center text-gray-400 py-10 bg-gray-800/20 rounded-2xl border border-dashed border-gray-700">
            {t("checklist.form.selectEquipmentHint")}
          </div>
        )}
      </div>
    </div>
  );
}
