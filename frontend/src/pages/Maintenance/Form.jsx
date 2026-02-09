// frontend/src/pages/Maintenance/Form.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Wrench, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import { useTranslation } from "react-i18next";

export default function MaintenanceForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache();
  const { t } = useTranslation();

  // 🚫 Driver cannot access
  if (user?.role === "Driver") {
    navigate("/", { replace: true });
    return null;
  }

  const todayDate = new Date().toISOString().split("T")[0];

  const [descriptionType, setDescriptionType] = useState("");
  const [otherDescription, setOtherDescription] = useState("");

  const [form, setForm] = useState({
    Date: todayDate,
    "Model / Type": "",
    "Plate Number": "",
    Driver: "",
    "Description of Work": "",
    "Performed By": user?.role === "Mechanic" ? user?.full_name || "" : "",
    "Completion Date": todayDate,
    Comments: "",
    "Photo Before": "",
    "Photo After": "",
    "Photo Repair/Problem": "",
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [mechanicOptions, setMechanicOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Description options (i18n-safe)
  const DESCRIPTION_OPTIONS = [
    { key: "Oil Service", label: t("requestTypes.Oil Service") },
    { key: "Grease Service", label: t("requestTypes.Grease Service") },
    {
      key: "Full Service (Oil + Greasing)",
      label: t("requestTypes.Full Service (Oil + Greasing)"),
    },
    { key: "OTHER", label: t("maintenance.form.otherOption") }
  ];

  // Load initial data from cache on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const hasModels = cache.getModels && cache.getModels().length > 0;
        if (!hasModels) {
          await cache.forceRefreshEquipment?.();
        }
        setModelOptions(cache.getModels ? cache.getModels() : []);

        // Load usernames and filter for mechanics
        const hasUsernames = cache.getUsernames && cache.getUsernames().length > 0;
        if (!hasUsernames) {
          await cache.forceRefreshUsernames?.();
        }
        const allUsers = cache.getUsernames ? cache.getUsernames() : [];
        const mechanics = allUsers
          .filter((u) => u.Role === "Mechanic")
          .map((u) => u.Name)
          .filter(Boolean);
        setMechanicOptions(mechanics);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [cache]);

  // Dynamic linking: When Model/Type is selected, update available Plate Numbers AND Drivers
  // BUT: If a Plate Number is already selected, don't change drivers (plate takes precedence)
  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      setDriverOptions([]);
      return;
    }
    
    // Get all plates that match the selected model
    const plates = cache.getPlatesByModel?.(model) || [];
    setPlateOptions(plates);

    // Only update drivers if NO plate is selected (plate has priority over model)
    if (!form["Plate Number"]) {
      // Get all drivers assigned to equipment of this model type
      const allEquipment = cache.getEquipment ? cache.getEquipment() : [];
      const equipmentOfThisModel = allEquipment.filter(e => e["Model / Type"] === model);
      const driversForThisModel = [
        ...new Set(
          equipmentOfThisModel.flatMap((e) => [
            e["Driver 1"],
            e["Driver 2"],
            e["Driver"]
          ]).filter(Boolean)
        )
      ];
      setDriverOptions(driversForThisModel);
    }
    // If plate is selected, drivers are already set by the plate useEffect, so don't override
  }, [form["Model / Type"], form["Plate Number"], cache]);

  // Dynamic linking: When Plate Number is selected, auto-fill Model and update Drivers
  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) {
      // If plate is cleared but model is still selected, restore drivers for that model
      if (form["Model / Type"]) {
        const allEquipment = cache.getEquipment ? cache.getEquipment() : [];
        const equipmentOfThisModel = allEquipment.filter(e => e["Model / Type"] === form["Model / Type"]);
        const driversForThisModel = [
          ...new Set(
            equipmentOfThisModel.flatMap((e) => [
              e["Driver 1"],
              e["Driver 2"],
              e["Driver"]
            ]).filter(Boolean)
          )
        ];
        setDriverOptions(driversForThisModel);
      } else {
        setDriverOptions([]);
      }
      return;
    }

    // Get the equipment that matches this plate
    const eq = cache.getEquipmentByPlate?.(plate);
    if (eq) {
      // Auto-fill the Model/Type field
      setForm((p) => ({
        ...p,
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
      // Update driver options to only show the 2 drivers for this specific equipment
      setDriverOptions(cache.getDriversByPlate?.(plate) || []);
    }
  }, [form["Plate Number"], cache]);

  // Dynamic linking: When Driver is selected, auto-fill Model and Plate if there's only one match
  useEffect(() => {
    const driver = form.Driver;
    if (!driver) return;

    // Get all equipment that this driver is assigned to
    const allEquipment = cache.getEquipment ? cache.getEquipment() : cache.equipment || [];
    const matches = (allEquipment || []).filter(
      (e) => e["Driver 1"] === driver || e["Driver 2"] === driver || e["Driver"] === driver
    );

    // If driver is assigned to only ONE equipment, auto-fill everything
    if (matches.length === 1) {
      const eq = matches[0];
      setForm((p) => ({
        ...p,
        "Plate Number": eq["Plate Number"] || p["Plate Number"],
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
      setPlateOptions([eq["Plate Number"]]);
      setDriverOptions([matches[0]["Driver 1"], matches[0]["Driver 2"]].filter(Boolean));
    } 
    // If driver is assigned to multiple equipment, show all matching plates and models
    else if (matches.length > 1) {
      const models = [...new Set(matches.map(m => m["Model / Type"]))];
      
      // If driver has only one model type, auto-fill model
      if (models.length === 1) {
        setForm((p) => ({
          ...p,
          "Model / Type": models[0] || p["Model / Type"],
        }));
      }
      
      setPlateOptions(matches.map((m) => m["Plate Number"]));
      setDriverOptions([...new Set(matches.flatMap((m) => [m["Driver 1"], m["Driver 2"]]).filter(Boolean))]);
    } 
    // If no matches found, reset plate options
    else {
      setPlateOptions([]);
    }
  }, [form.Driver, cache]);

  const handleChange = (name, value) =>
    setForm((p) => ({ ...p, [name]: value }));

  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange(field, reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required dropdown fields individually for specific errors
    if (!form["Model / Type"] || !form["Plate Number"] || !form.Driver) {
      alert(t("maintenance.form.alerts.missingAsset"));
      return;
    }

    if (!form["Performed By"]) {
      alert(t("maintenance.form.alerts.missingPerformer"));
      return;
    }

    const finalDescription =
      descriptionType === "OTHER"
        ? otherDescription.trim()
        : descriptionType;

    if (!finalDescription) {
      alert(t("maintenance.form.alerts.missingDescription"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        "Description of Work": finalDescription,
        "Completion Date": form.Date,
      };

      const res = await fetchWithAuth("/api/add/Maintenance_Log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.status === "success") {
        alert(`✅ ${t("maintenance.form.alerts.success")}`);
        navigate("/maintenance");
      } else {
        alert(`❌ ${t("maintenance.form.alerts.error")}: ${data.message || ""}`);
      }
    } catch {
      alert(`⚠️ ${t("maintenance.form.alerts.networkError")}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading screen while fetching initial data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center h-[calc(100vh-120px)]">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mb-4" />
          <p className="text-lg text-gray-300">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t("maintenance.form.title")}</h1>
            <p className="text-gray-400 text-sm">
              {t("maintenance.form.subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("maintenance.form.date")}
              </label>
              <input
                type="date"
                value={form.Date}
                onChange={(e) => handleChange("Date", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
              />
            </div>

            {/* Model/Type dropdown - filters Plate Number AND Driver options (unless plate is selected) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("maintenance.form.model")}
              </label>
              <select
                value={form["Model / Type"]}
                onChange={(e) => handleChange("Model / Type", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
              >
                <option value="">{t("maintenance.form.chooseModel")}</option>
                {modelOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Plate Number dropdown - auto-fills Model and shows only the 2 drivers for this equipment */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("maintenance.form.plate")}
              </label>
              <select
                value={form["Plate Number"]}
                onChange={(e) => handleChange("Plate Number", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
              >
                <option value="">{t("maintenance.form.choosePlate")}</option>
                {(plateOptions.length
                  ? plateOptions
                  : cache.getEquipment?.() || []
                ).map((p) => {
                  const plate =
                    typeof p === "string" ? p : p["Plate Number"];
                  return (
                    <option key={plate} value={plate}>
                      {plate}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Driver dropdown - shows filtered drivers based on Model/Plate selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("maintenance.form.driver")}
              </label>
              <select
                value={form.Driver}
                onChange={(e) => handleChange("Driver", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
              >
                <option value="">{t("maintenance.form.chooseDriver")}</option>
                {(driverOptions.length
                  ? driverOptions
                  : Array.from(
                      new Set(
                        (cache.getEquipment?.() || [])
                          .flatMap((e) => [
                            e["Driver 1"],
                            e["Driver 2"],
                            e["Driver"],
                          ])
                          .filter(Boolean)
                      )
                    )
                ).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("maintenance.form.description")}
            </label>
            <select
              value={descriptionType}
              onChange={(e) => {
                setDescriptionType(e.target.value);
                if (e.target.value !== "OTHER") {
                  setOtherDescription("");
                }
              }}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
            >
              <option value="">{t("maintenance.form.chooseDescription")}</option>
              {DESCRIPTION_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>

            {descriptionType === "OTHER" && (
              <textarea
                rows={3}
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                className="mt-3 w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
                placeholder={t("maintenance.form.descriptionPlaceholder")}
              />
            )}
          </div>

          {/* Performed By - now editable dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("maintenance.form.performedBy")}
            </label>
            <select
              value={form["Performed By"]}
              onChange={(e) => handleChange("Performed By", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
            >
              <option value="">
                {user?.role === "Supervisor" 
                  ? t("maintenance.form.selectMechanic") 
                  : t("maintenance.form.chooseMechanic")}
              </option>
              {mechanicOptions.map((mechanic) => (
                <option key={mechanic} value={mechanic}>
                  {mechanic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("maintenance.form.comments")}
            </label>
            <textarea
              rows={3}
              value={form.Comments}
              onChange={(e) => handleChange("Comments", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
            />
          </div>

          {/* Photo upload fields */}
          {[ 
            { key: "Photo Before", label: t("maintenance.form.photoBefore") },
            { key: "Photo After", label: t("maintenance.form.photoAfter") },
            { key: "Photo Repair/Problem", label: t("maintenance.form.photoProblem") },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-2">{label}</label>
              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-green-600 px-4 py-3 rounded-xl">
                  <Upload size={18} />
                  {t("common.upload")}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                      handleFile(e.target.files?.[0], key)
                    }
                  />
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 px-4 py-3 rounded-xl">
                  <Camera size={18} />
                  {t("common.camera")}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) =>
                      handleFile(e.target.files?.[0], key)
                    }
                  />
                </label>
              </div>

              {form[key] && (
                <div className="mt-4">
                  <img
                    src={form[key]}
                    alt={label}
                    className="max-h-64 mx-auto rounded-lg"
                  />
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold text-lg disabled:opacity-50"
          >
            {submitting
              ? t("common.submitting")
              : t("maintenance.form.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
