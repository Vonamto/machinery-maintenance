// frontend/src/pages/Checklist/Form.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Camera,
  Loader2,
  ClipboardCheck,
  Droplets,
  Zap,
  Circle,
  Settings,
  ArrowUpCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import { useTranslation } from "react-i18next";
import { getChecklistTemplate } from "@/config/checklistTemplates";
import { PAGE_PERMISSIONS } from "@/config/roles";

export default function ChecklistForm() {
  const { user } = useAuth();
  const cache = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* -------------------- STATE -------------------- */
  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split("T")[0],
    "Full Name": "",
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

  // Determine if user is a Driver
  const isDriver = user?.role === "Driver";

  /* -------------------- ACCESS CONTROL (Centralized) -------------------- */
  useEffect(() => {
    if (!PAGE_PERMISSIONS.CHECKLIST_FORM.includes(user?.role)) {
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
              "Full Name": user.full_name || "",
              "Model / Type": assigned["Model / Type"] || "",
              "Plate Number": assigned["Plate Number"] || "",
              "Equipment Type": assigned["Equipment Type"] || ""
            }));
          } else {
            // Driver not assigned to any equipment, but set their name
            setFormData(prev => ({
              ...prev,
              "Full Name": user.full_name || ""
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

  /* -------------------- DYNAMIC DROPDOWN LOGIC (Non-Driver Roles) -------------------- */
  
  // Update plate options and drivers based on selected model
  useEffect(() => {
    if (isDriver) return; // Skip for drivers

    const model = formData["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      return;
    }

    // Get all plates that match the selected model
    const plates = cache.getPlatesByModel ? cache.getPlatesByModel(model) : [];
    setPlateOptions(plates);

    // Only update drivers if NO plate is selected (plate has priority over model)
    if (!formData["Plate Number"]) {
      // Get all drivers assigned to equipment of this model type
      const allEquipment = cache.getEquipment ? cache.getEquipment() : [];
      const equipmentOfThisModel = allEquipment.filter(e => e["Model / Type"] === model);
      const driversForThisModel = [...new Set(
        equipmentOfThisModel.flatMap(e => [e["Driver 1"], e["Driver 2"]]).filter(Boolean)
      )];
      setDriverOptions(driversForThisModel);
    }
    // If plate is selected, drivers are already set by the plate useEffect, so don't override
  }, [formData["Model / Type"], formData["Plate Number"], cache, isDriver]);

  // Update model, equipment type, and drivers based on selected plate
  useEffect(() => {
    if (isDriver) return; // Skip for drivers

    const plate = formData["Plate Number"];
    if (!plate) {
      // If plate is cleared but model is still selected, restore drivers for that model
      if (formData["Model / Type"]) {
        const allEquipment = cache.getEquipment ? cache.getEquipment() : [];
        const equipmentOfThisModel = allEquipment.filter(e => e["Model / Type"] === formData["Model / Type"]);
        const driversForThisModel = [...new Set(
          equipmentOfThisModel.flatMap(e => [e["Driver 1"], e["Driver 2"]]).filter(Boolean)
        )];
        setDriverOptions(driversForThisModel);
      } else {
        setDriverOptions([]);
      }
      return;
    }

    // Get the equipment that matches this plate
    const eq = cache.getEquipmentByPlate ? cache.getEquipmentByPlate(plate) : null;
    if (eq) {
      // Auto-fill the Model/Type and Equipment Type fields
      setFormData(prev => ({
        ...prev,
        "Model / Type": eq["Model / Type"] || prev["Model / Type"],
        "Equipment Type": eq["Equipment Type"] || prev["Equipment Type"]
      }));

      // Update driver options to only show the 2 drivers for this specific equipment
      const drivers = cache.getDriversByPlate ? cache.getDriversByPlate(plate) : [];
      setDriverOptions(drivers);
    }
  }, [formData["Plate Number"], formData["Model / Type"], cache, isDriver]);

  // Update plates and model based on selected driver
  useEffect(() => {
    if (isDriver) return; // Skip for drivers

    const driver = formData["Full Name"];
    if (!driver) return;

    // Get all equipment that this driver is assigned to
    const allEquipment = cache.getEquipment ? cache.getEquipment() : [];
    const matches = allEquipment.filter(
      e => e["Driver 1"] === driver || e["Driver 2"] === driver
    );

    // If driver is assigned to only ONE equipment, auto-fill everything
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
    } 
    // If driver is assigned to multiple equipment, show all matching plates and models
    else if (matches.length > 1) {
      const models = [...new Set(matches.map(m => m["Model / Type"]))];
      
      // If driver has only one model type, auto-fill model
      if (models.length === 1) {
        setFormData(prev => ({
          ...prev,
          "Model / Type": models[0]
        }));
      }
      
      setPlateOptions(matches.map(m => m["Plate Number"]));
      setDriverOptions([...new Set(matches.flatMap(m => [m["Driver 1"], m["Driver 2"]]).filter(Boolean))]);
    } 
    // If no matches found, reset plate options
    else {
      setPlateOptions([]);
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

  /* -------------------- SECTION ICON & COLORS -------------------- */
  const getSectionIcon = (sectionKey, size = 20) => {
    const iconMap = {
      "general_inspection": <ClipboardCheck size={size} />,
      "fluids_check": <Droplets size={size} />,
      "electrical": <Zap size={size} />,
      "tires": <Circle size={size} />,
      "emergency_equipment": <AlertTriangle size={size} />,
      "hydraulic_system": <Settings size={size} />,
      "lifting_system": <ArrowUpCircle size={size} />
    };
    return iconMap[sectionKey] || <ClipboardCheck size={size} />;
  };

  const getSectionColors = (sectionKey) => {
    const colorMap = {
      "general_inspection": {
        gradient: "from-emerald-900/30 to-teal-900/30",
        border: "border-emerald-700/30",
        iconBg: "bg-emerald-500/10",
        textColor: "text-emerald-300",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
      },
      "fluids_check": {
        gradient: "from-blue-900/30 to-cyan-900/30",
        border: "border-blue-700/30",
        iconBg: "bg-blue-500/10",
        textColor: "text-blue-300",
        glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]"
      },
      "electrical": {
        gradient: "from-yellow-900/30 to-amber-900/30",
        border: "border-yellow-700/30",
        iconBg: "bg-yellow-500/10",
        textColor: "text-yellow-300",
        glow: "shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_20px_rgba(234,179,8,0.25)]"
      },
      "tires": {
        gradient: "from-gray-900/30 to-slate-900/30",
        border: "border-gray-700/30",
        iconBg: "bg-gray-500/10",
        textColor: "text-gray-300",
        glow: "shadow-[0_0_15px_rgba(100,116,139,0.15)] hover:shadow-[0_0_20px_rgba(100,116,139,0.25)]"
      },
      "emergency_equipment": {
        gradient: "from-red-900/30 to-orange-900/30",
        border: "border-red-700/30",
        iconBg: "bg-red-500/10",
        textColor: "text-red-300",
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]"
      },
      "hydraulic_system": {
        gradient: "from-purple-900/30 to-indigo-900/30",
        border: "border-purple-700/30",
        iconBg: "bg-purple-500/10",
        textColor: "text-purple-300",
        glow: "shadow-[0_0_15px_rgba(147,51,234,0.15)] hover:shadow-[0_0_20px_rgba(147,51,234,0.25)]"
      },
      "lifting_system": {
        gradient: "from-pink-900/30 to-rose-900/30",
        border: "border-pink-700/30",
        iconBg: "bg-pink-500/10",
        textColor: "text-pink-300",
        glow: "shadow-[0_0_15px_rgba(236,72,153,0.15)] hover:shadow-[0_0_20px_rgba(236,72,153,0.25)]"
      }
    };
    
    return colorMap[sectionKey] || colorMap["general_inspection"];
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

  // Get all driver names from Equipment_List for dropdown (for non-Driver roles)
  const allDriverNames = cache.getEquipment
    ? [...new Set(
        cache.getEquipment()
          .flatMap(e => [e["Driver 1"], e["Driver 2"]])
          .filter(Boolean)
      )]
    : [];

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
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t("common.back")}
        </button>

        {/* Header with Icon, Title, and Subtitle */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/40">
              <ClipboardCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                {t("checklist.form.title")}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {t("checklist.form.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* BASIC INFO */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
            <CheckCircle size={20} />
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
                className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white disabled:bg-gray-900/50 disabled:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Full Name / Driver */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("checklist.form.fullName")}
              </label>
              {isDriver ? (
                <input
                  value={formData["Full Name"]}
                  disabled
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
                />
              ) : (
                <select
                  value={formData["Full Name"]}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      "Full Name": e.target.value
                    }))
                  }
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="">
                    {t("checklist.form.chooseInspector")}
                  </option>
                  {(driverOptions.length ? driverOptions : allDriverNames).map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Model / Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("checklist.form.model")}
              </label>
              {isDriver ? (
                <input
                  value={formData["Model / Type"]}
                  disabled
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
                />
              ) : (
                <select
                  value={formData["Model / Type"]}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      "Model / Type": e.target.value,
                      "Plate Number": ""
                    }))
                  }
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="">
                    {t("checklist.form.chooseModel")}
                  </option>
                  {modelOptions.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Plate Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("checklist.form.plate")}
              </label>
              {isDriver ? (
                <input
                  value={formData["Plate Number"]}
                  disabled
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
                />
              ) : (
                <select
                  value={formData["Plate Number"]}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      "Plate Number": e.target.value
                    }))
                  }
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
              )}
            </div>
          </div>
        </div>

        {/* CHECKLIST */}
        {formData["Equipment Type"] && !loading ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {template.map(section => {
              const colors = getSectionColors(section.sectionKey);
              return (
                <div
                  key={section.sectionKey}
                  className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 ${colors.glow} transition-all`}
                >
                  {/* Section Header with Section-Specific Colors */}
                  <div className={`bg-gradient-to-r ${colors.gradient} -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl border-b ${colors.border}`}>
                    <h3 className={`text-lg font-semibold ${colors.textColor} flex items-center gap-3`}>
                      <div className={`p-2 rounded-lg ${colors.iconBg}`}>
                        {getSectionIcon(section.sectionKey, 20)}
                      </div>
                      {t(section.titleKey)}
                    </h3>
                  </div>

                  {/* Section Items */}
                  <div className="space-y-3">
                    {section.items.map(item => {
                      const key = `${section.sectionKey}.${item.key}`;
                      const state = checklistData[key];
                      return (
                        <div
                          key={key}
                          className="p-4 bg-gray-900/40 rounded-xl border border-gray-700 hover:border-gray-600 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-gray-200 font-medium">
                              {t(`checklist.items.${item.key}`)}
                            </span>
                            <div className="flex gap-3">
                              <CheckCircle
                                size={22}
                                onClick={() => handleStatusChange(key, "OK")}
                                className={`cursor-pointer transition-all hover:scale-110 ${
                                  state?.status === "OK" 
                                    ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
                                    : "text-gray-600 hover:text-emerald-400"
                                }`}
                              />
                              <AlertTriangle
                                size={22}
                                onClick={() => handleStatusChange(key, "Warning")}
                                className={`cursor-pointer transition-all hover:scale-110 ${
                                  state?.status === "Warning" 
                                    ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
                                    : "text-gray-600 hover:text-amber-400"
                                }`}
                              />
                              <XCircle
                                size={22}
                                onClick={() => handleStatusChange(key, "Fail")}
                                className={`cursor-pointer transition-all hover:scale-110 ${
                                  state?.status === "Fail" 
                                    ? "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]" 
                                    : "text-gray-600 hover:text-red-400"
                                }`}
                              />
                            </div>
                          </div>
                          {(state?.status === "Warning" || state?.status === "Fail") && (
                            <div className="mt-3 space-y-3 pt-3 border-t border-gray-700">
                              <textarea
                                value={state.comment}
                                onChange={e =>
                                  handleCommentChange(key, e.target.value)
                                }
                                rows={2}
                                className="w-full p-3 rounded-lg bg-gray-900/70 border border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                                placeholder={t("checklist.form.commentPlaceholder")}
                              />
                              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-cyan-400 transition">
                                <Camera size={16} />
                                <span>{t("checklist.form.uploadPhoto")}</span>
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
                                  className="w-32 h-32 object-cover rounded-lg border-2 border-cyan-500/50 shadow-lg"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
            >
              {submitting ? t("common.submitting") : t("common.submit")}
            </button>
          </form>
        ) : (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700">
            <ClipboardCheck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {t("checklist.form.selectEquipmentHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
