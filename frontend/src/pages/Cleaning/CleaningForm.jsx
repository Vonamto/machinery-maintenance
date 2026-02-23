// frontend/src/pages/Cleaning/CleaningForm.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Droplets, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import { useTranslation } from "react-i18next";

export default function CleaningForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache();
  const { t } = useTranslation();
  const todayDate = new Date().toISOString().split("T")[0];

  // ✅ Destructure raw data arrays from cache.
  // These only get a new reference when actual server data arrives,
  // so they are safe to use as useEffect dependencies.
  const { equipment, usernames } = cache;

  const [form, setForm] = useState({
    Date: todayDate,
    "Model / Type": "",
    "Plate Number": "",
    Driver: "",
    "Cleaned By": user?.full_name || "",
    "Cleaning Type": "",
    Comments: "",
    "Photo Before": "",
    "Photo After": "",
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false); // ✅ replaces the old `loading` state

  // ✅ FIX 1: Runs ONCE on mount.
  // Triggers a refresh only if cache is empty, then marks the form as ready.
  // NEVER reads from `cache` after the await — that would be a stale closure.
  // The actual data is picked up reactively by the effect below.
  useEffect(() => {
    const init = async () => {
      if (!equipment.length) await cache.forceRefreshEquipment?.();
      if (!usernames.length) await cache.forceRefreshUsernames?.();
      setReady(true);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ FIX 2: Reactively syncs modelOptions whenever equipment data arrives or changes.
  // This fires AFTER forceRefreshEquipment resolves and React commits the new equipment state,
  // so cache.getModels() here always returns fresh data.
  useEffect(() => {
    setModelOptions(cache.getModels?.() || []);
  }, [equipment]); // depends on the raw data array, not the cache object

  // ✅ FIX 3: Model/Plate dynamic linking.
  // Changed dep from `cache` → `equipment` so this only re-runs when real data changes.
  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      setDriverOptions([]);
      return;
    }
    const plates = cache.getPlatesByModel?.(model) || [];
    setPlateOptions(plates);
    if (!form["Plate Number"]) {
      const allEquipment = cache.getEquipmentList?.() || [];
      const driversForThisModel = [
        ...new Set(
          allEquipment
            .filter(e => e["Model / Type"] === model)
            .flatMap(e => [e["Driver 1"], e["Driver 2"], e["Driver"]])
            .filter(Boolean)
        ),
      ];
      setDriverOptions(driversForThisModel);
    }
  }, [form["Model / Type"], form["Plate Number"], equipment]); // ✅ equipment, not cache

  // ✅ FIX 4: Plate dynamic linking.
  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) {
      if (form["Model / Type"]) {
        const allEquipment = cache.getEquipmentList?.() || [];
        const driversForThisModel = [
          ...new Set(
            allEquipment
              .filter(e => e["Model / Type"] === form["Model / Type"])
              .flatMap(e => [e["Driver 1"], e["Driver 2"], e["Driver"]])
              .filter(Boolean)
          ),
        ];
        setDriverOptions(driversForThisModel);
      } else {
        setDriverOptions([]);
      }
      return;
    }
    const eq = cache.getEquipmentByPlate?.(plate);
    if (eq) {
      setForm(p => ({ ...p, "Model / Type": eq["Model / Type"] || p["Model / Type"] }));
      setDriverOptions(cache.getDriversByPlate?.(plate) || []);
    }
  }, [form["Plate Number"], equipment]); // ✅ equipment, not cache

  // ✅ FIX 5: Driver dynamic linking.
  useEffect(() => {
    const driver = form.Driver;
    if (!driver) return;
    const allEquipment = cache.getEquipmentList?.() || [];
    const matches = allEquipment.filter(
      e => e["Driver 1"] === driver || e["Driver 2"] === driver || e["Driver"] === driver
    );
    if (matches.length === 1) {
      const eq = matches[0];
      setForm(p => ({
        ...p,
        "Plate Number": eq["Plate Number"] || p["Plate Number"],
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
      setPlateOptions([eq["Plate Number"]]);
      setDriverOptions([eq["Driver 1"], eq["Driver 2"]].filter(Boolean));
    } else if (matches.length > 1) {
      const models = [...new Set(matches.map(m => m["Model / Type"]))];
      if (models.length === 1) {
        setForm(p => ({ ...p, "Model / Type": models[0] || p["Model / Type"] }));
      }
      setPlateOptions(matches.map(m => m["Plate Number"]));
      setDriverOptions([
        ...new Set(matches.flatMap(m => [m["Driver 1"], m["Driver 2"]]).filter(Boolean)),
      ]);
    } else {
      setPlateOptions([]);
    }
  }, [form.Driver, equipment]); // ✅ equipment, not cache

  const handleChange = (name, value) => setForm(p => ({ ...p, [name]: value }));

  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange(field, reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form["Model / Type"] && !form["Plate Number"] && !form.Driver) {
      alert(t("cleaning.form.alerts.missingAsset"));
      return;
    }
    if (!form["Cleaned By"]) {
      alert(t("cleaning.form.alerts.missingCleaner"));
      return;
    }
    if (!form["Cleaning Type"]) {
      alert(t("cleaning.form.alerts.missingCleaningType"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/add/Cleaning_Log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert(t("cleaning.form.alerts.success"));
        navigate("/cleaning");
      } else {
        alert(`${t("cleaning.form.alerts.error")}: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert(t("cleaning.form.alerts.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Derived directly from raw usernames array — always in sync
  const allUserNames = (usernames || [])
    .map(u => u.Name || u["Full Name"])
    .filter(Boolean);

  // ✅ Show spinner until init() completes (i.e., until fetch is done or cache was already warm)
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center h-[calc(100vh-120px)]">
          <Loader2 className="h-12 w-12 animate-spin text-sky-400 mb-4" />
          <p className="text-lg text-gray-300">{t("common.loading") || "Loading form data..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate("/cleaning")}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t("cleaning.form.back")}
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-500 shadow-lg shadow-sky-500/40">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
              {t("cleaning.form.title")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{t("cleaning.form.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("cleaning.form.date")}
              </label>
              <input
                type="date"
                value={form.Date}
                onChange={e => handleChange("Date", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("cleaning.form.model")}
              </label>
              <select
                value={form["Model / Type"]}
                onChange={e => handleChange("Model / Type", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              >
                <option value="">{t("cleaning.form.chooseModel")}</option>
                {modelOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("cleaning.form.plate")}
              </label>
              <select
                value={form["Plate Number"]}
                onChange={e => handleChange("Plate Number", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              >
                <option value="">{t("cleaning.form.choosePlate")}</option>
                {(plateOptions.length
                  ? plateOptions
                  : cache.getEquipmentList?.() || []
                ).map(p => {
                  const plate = typeof p === "string" ? p : p["Plate Number"];
                  return <option key={plate} value={plate}>{plate}</option>;
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("cleaning.form.driver")}
              </label>
              <select
                value={form.Driver}
                onChange={e => handleChange("Driver", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              >
                <option value="">{t("cleaning.form.chooseDriver")}</option>
                {(driverOptions.length
                  ? driverOptions
                  : [
                      ...new Set(
                        (cache.getEquipmentList?.() || [])
                          .flatMap(eq => [eq["Driver 1"], eq["Driver 2"], eq["Driver"]])
                          .filter(Boolean)
                      ),
                    ]
                ).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("cleaning.form.cleanedBy")}
            </label>
            <select
              value={form["Cleaned By"]}
              onChange={e => handleChange("Cleaned By", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            >
              <option value="">{t("cleaning.form.selectCleaner")}</option>
              {allUserNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("cleaning.form.cleaningType")}
            </label>
            <select
              value={form["Cleaning Type"]}
              onChange={e => handleChange("Cleaning Type", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            >
              <option value="">{t("cleaning.form.selectCleaningType")}</option>
              <option value="Blow Cleaning">{t("cleaningTypes.Blow Cleaning")}</option>
              <option value="Water Wash">{t("cleaningTypes.Water Wash")}</option>
              <option value="Full Cleaning (Air & Water)">
                {t("cleaningTypes.Full Cleaning (Air & Water)")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("cleaning.form.comments")}
            </label>
            <textarea
              rows={3}
              value={form.Comments}
              onChange={e => handleChange("Comments", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
            />
          </div>

          {["Photo Before", "Photo After"].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                {t(`cleaning.form.${field.toLowerCase().replace(" ", "")}`)}
              </label>
              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50">
                  <Upload size={18} />
                  <span className="font-medium">{t("common.upload")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFile(e.target.files?.[0], field)}
                  />
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
                  <Camera size={18} />
                  <span className="font-medium">{t("common.camera")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleFile(e.target.files?.[0], field)}
                  />
                </label>
              </div>
              {form[field] && (
                <div className="mt-4 p-2 bg-gray-800/30 rounded-xl border border-gray-700">
                  <img
                    src={form[field]}
                    alt={t(`cleaning.form.${field.toLowerCase().replace(" ", "")}`)}
                    className="max-h-64 mx-auto rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-500 hover:from-sky-700 hover:to-indigo-600 text-white font-semibold text-lg shadow-lg shadow-sky-500/50 hover:shadow-sky-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t("cleaning.form.submitting")}
              </span>
            ) : (
              t("cleaning.form.submit")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
