// frontend/src/pages/Checklist/Form.jsx
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
  const cache = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* -------------------- STATE -------------------- */
  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split("T")[0],
    "Full Name": user?.full_name || "",
    "Model / Type": "",
    "Plate Number": "",
    "Equipment Type": ""
  });

  const [checklistData, setChecklistData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);

  const isDriver = user?.role === "Driver";
  const isSupervisorOrMechanic =
    user?.role === "Supervisor" || user?.role === "Mechanic";

  /* -------------------- ACCESS CONTROL -------------------- */
  useEffect(() => {
    if (user?.role === "Cleaning Guy") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* -------------------- LOAD INITIAL DATA -------------------- */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Check if essential data exists in cache
        const hasModels = cache.getModels && cache.getModels().length > 0;
        const hasEquipment = cache.getEquipment && cache.getEquipment().length > 0;
        const hasUsernames = cache.getUsernames && cache.getUsernames().length > 0;

        // If data is missing, force a refresh
        if (!hasModels || !hasEquipment || !hasUsernames) {
          await Promise.allSettled([
            cache.forceRefreshEquipment?.(),
            cache.forceRefreshUsernames?.()
          ]);
        }

        // After attempting to load, set initial options from cache
        const models = cache.getModels ? cache.getModels() : [];
        setModelOptions(models);

        // For Drivers: Auto-fill their assigned equipment
        if (isDriver && cache.getEquipment) {
          const equipment = cache.getEquipment();
          const assigned = equipment.find(
            e =>
              e["Driver 1"] === user.full_name ||
              e["Driver 2"] === user.full_name
          );

          if (assigned) {
            setFormData(prev => ({
              ...prev,
              "Model / Type": assigned["Model / Type"] || "",
              "Plate Number": assigned["Plate Number"] || "",
              "Equipment Type": assigned["Equipment Type"] || ""
            }));
          }
        }
      } catch (err) {
        console.error("Error during initial data load:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [cache, isDriver, user]);

  /* -------------------- DYNAMIC DROPDOWN LOGIC (Supervisor/Mechanic) -------------------- */
  
  // Update plate options based on selected model
  useEffect(() => {
    if (isDriver) return; // Skip for drivers

    const model = formData["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      return;
    }

    const plates = cache.getPlatesByModel ? cache.getPlatesByModel(model) : [];
    setPlateOptions(plates);
  }, [formData["Model / Type"], cache, isDriver]);

  // Update model and drivers based on selected plate
  useEffect(() => {
    if (isDriver) return; // Skip for drivers

    const plate = formData["Plate Number"];
    if (!plate) {
      setDriverOptions([]);
      return;
    }

    const eq = cache.getEquipmentByPlate ? cache.getEquipmentByPlate(plate) : null;
    if (eq) {
      setFormData(prev => ({
        ...prev,
        "Model / Type": eq["Model / Type"] || prev["Model / Type"],
        "Equipment Type": eq["Equipment Type"] || prev["Equipment Type"]
      }));

      const drivers = cache.getDriversByPlate ? cache.getDriversByPlate(plate) : [];
      setDriverOptions(drivers);
    }
  }, [formData["Plate Number"], cache, isDriver]);

  // Update plates and model based on selected driver
  useEffect(() => {
    if (isDriver) return; // Skip for drivers

    const driver = formData["Full Name"];
    if (!driver) return;

    const allEquipment = cache.getEquipment ? cache.getEquipment() : [];
    const matches = allEquipment.filter(
      e => e["Driver 1"] === driver || e["Driver 2"] === driver
    );

    if (matches.length === 1) {
      const eq = matches[0];
      setFormData(prev => ({
        ...prev,
        "Plate Number": eq["Plate Number"] || prev["Plate Number"],
        "Model / Type": eq["Model / Type"] || prev["Model / Type"],
        "Equipment Type": eq["Equipment Type"] || prev["Equipment Type"]
      }));
      setPlateOptions([eq["Plate Number"]]);
      setDriverOptions([eq["Driver 1"], eq["Driver 2"]].filter(Boolean));
    } else if (matches.length > 1) {
      setPlateOptions(matches.map(m => m["Plate Number"]));
      setDriverOptions([...new Set(matches.flatMap(m => [m["Driver 1"], m["Driver 2"]]).filter(Boolean))]);
    } else {
      setPlateOptions([]);
      setDriverOptions([]);
    }
  }, [formData["Full Name"], cache, isDriver]);

  /* -------------------- INIT CHECKLIST BASED ON EQUIPMENT TYPE -------------------- */
  useEffect(() => {
    if (!formData["Equipment Type"]) return;

    const template = getChecklistTemplate(formData["Equipment Type"]);
    if (!template.length) return;

    const initial = {};
    template.forEach(section => {
      section.items.forEach(item => {
        const key = `${section.sectionKey}.${item.key}`;
        initial[key] = { status: null, comment: "", photo: "" };
      });
    });

    setChecklistData(initial);
  }, [formData["Equipment Type"]]);

  /* -------------------- HANDLERS -------------------- */
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

  /* -------------------- SUBMIT -------------------- */
  const handleSubmit = async e => {
    e.preventDefault();

    // Validate all items are checked
    if (Object.values(checklistData).some(i => i.status === null)) {
      alert(t("checklist.form.alerts.error") || "Please check all items before submitting.");
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

  // Get usernames for Supervisor/Mechanic dropdown
  const cachedUsers = cache.getUsernames ? cache.getUsernames() : cache.usernames || [];
  const allUserNames = (cachedUsers || [])
    .map(u => u.Name || u["Full Name"])
    .filter(Boolean);

  /* -------------------- LOADING SCREEN -------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
        <Navbar user={user} />
        <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col items-center justify-center h-[calc(100vh-120px)]">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mb-4" />
          <p className="text-lg text-gray-300">{t("common.loading") || "Loading form data..."}</p>
        </div>
      </div>
    );
  }

  /* -------------------- RENDER -------------------- */
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
          <div className="grid grid-cols-1 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("checklist.form.date")}
              </label>
              <input
                type="date"
                value={formData.Date}
                disabled={isDriver}
                onChange={e =>
                  setFormData(prev => ({ ...prev, Date: e.target.value }))
                }
                className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 disabled:bg-gray-900/50 disabled:text-gray-400"
              />
            </div>

            {/* Full Name / Driver */}
            {isSupervisorOrMechanic && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("checklist.form.fullName")}
                </label>
                <select
                  value={formData["Full Name"]}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      "Full Name": e.target.value
                    }))
                  }
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
                >
                  <option value="">
                    {t("checklist.form.chooseInspector")}
                  </option>
                  {allUserNames.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isDriver && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("checklist.form.fullName")}
                </label>
                <input
                  value={formData["Full Name"]}
                  disabled
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
                />
              </div>
            )}

            {/* Model / Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("checklist.form.model")}
              </label>
              {isSupervisorOrMechanic ? (
                <select
                  value={formData["Model / Type"]}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      "Model / Type": e.target.value,
                      "Plate Number": ""
                    }))
                  }
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
                >
                  <option value="">
                    {t("checklist.form.chooseModel")}
                  </option>
                  {modelOptions.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={formData["Model / Type"]}
                  disabled
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
                />
              )}
            </div>

            {/* Plate Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("checklist.form.plate")}
              </label>
              {isSupervisorOrMechanic ? (
                <select
                  value={formData["Plate Number"]}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      "Plate Number": e.target.value
                    }))
                  }
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
                >
                  <option value="">
                    {t("checklist.form.choosePlate")}
                  </option>
                  {(plateOptions.length
                    ? plateOptions
                    : cache.getEquipment
                    ? (cache.getEquipment() || []).map(e => e["Plate Number"])
                    : []
                  ).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={formData["Plate Number"]}
                  disabled
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
                />
              )}
            </div>
          </div>
        </div>

        {/* CHECKLIST */}
        {formData["Equipment Type"] && !loading ? (
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
                            className={`cursor-pointer ${state?.status === "OK" ? "text-emerald-400" : "text-gray-500"}`}
                          />
                          <AlertTriangle
                            size={18}
                            onClick={() => handleStatusChange(key, "Warning")}
                            className={`cursor-pointer ${state?.status === "Warning" ? "text-amber-400" : "text-gray-500"}`}
                          />
                          <XCircle
                            size={18}
                            onClick={() => handleStatusChange(key, "Fail")}
                            className={`cursor-pointer ${state?.status === "Fail" ? "text-red-400" : "text-gray-500"}`}
                          />
                        </div>
                      </div>
                      {(state?.status === "Warning" || state?.status === "Fail") && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={state.comment}
                            onChange={e =>
                              handleCommentChange(key, e.target.value)
                            }
                            className="w-full p-2 rounded-lg bg-gray-900/70 border border-gray-700"
                            placeholder={t("checklist.form.commentPlaceholder")}
                          />
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
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
                              className="w-24 h-24 object-cover rounded-lg border border-gray-600"
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {submitting ? t("common.submitting") : t("common.submit")}
            </button>
          </form>
        ) : (
          <div className="text-center text-gray-400">
            {t("checklist.form.selectEquipmentHint") || "Please select equipment to load checklist"}
          </div>
        )}
      </div>
    </div>
  );
}
