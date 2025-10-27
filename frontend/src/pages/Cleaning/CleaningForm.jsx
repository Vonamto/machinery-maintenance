// frontend/src/pages/Cleaning/CleaningForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Droplets } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";

export default function CleaningForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache();

  const todayDate = new Date().toISOString().split("T")[0];

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

  // Load models from cache
  useEffect(() => {
    const models = cache.getModels ? cache.getModels() : [];
    setModelOptions(models);
  }, [cache]);

  // Update plates when model changes
  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      return;
    }
    const plates = cache.getPlatesByModel ? cache.getPlatesByModel(model) : [];
    setPlateOptions(plates);
  }, [form["Model / Type"], cache]);

  // Update drivers when plate changes
  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) {
      setDriverOptions([]);
      return;
    }
    const eq = cache.getEquipmentByPlate ? cache.getEquipmentByPlate(plate) : null;
    if (eq) {
      setForm((p) => ({ ...p, "Model / Type": eq["Model / Type"] || p["Model / Type"] }));
      const drivers = cache.getDriversByPlate ? cache.getDriversByPlate(plate) : [];
      setDriverOptions(drivers);
    }
  }, [form["Plate Number"], cache]);

  // Auto-fill model & plate when driver is selected
  useEffect(() => {
    const driver = form.Driver;
    if (!driver) return;
    const allEquipment = cache.getEquipment ? cache.getEquipment() : cache.equipment || [];
    const matches = allEquipment.filter(
      (e) => e["Driver 1"] === driver || e["Driver 2"] === driver || e["Driver"] === driver
    );
    if (matches.length === 1) {
      const eq = matches[0];
      setForm((p) => ({
        ...p,
        "Plate Number": eq["Plate Number"] || p["Plate Number"],
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
      setPlateOptions([eq["Plate Number"]]);
      setDriverOptions([eq["Driver 1"], eq["Driver 2"]].filter(Boolean));
    } else if (matches.length > 1) {
      setPlateOptions(matches.map((m) => m["Plate Number"]));
      setDriverOptions([...new Set(matches.flatMap((m) => [m["Driver 1"], m["Driver 2"]]).filter(Boolean))]);
    } else {
      setPlateOptions([]);
    }
  }, [form.Driver, cache]);

  const handleChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange(field, reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form["Model / Type"] && !form["Plate Number"] && !form.Driver) {
      alert("Please choose at least Model, Plate Number, or Driver.");
      return;
    }
    if (!form["Cleaning Type"]) {
      alert("Please select a cleaning type.");
      return;
    }
    if (!form["Cleaned By"]) {
      alert("Please select who performed the cleaning.");
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
        alert("✅ Cleaning log added successfully.");
        navigate("/cleaning");
      } else {
        alert("❌ Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Network error submitting form.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get all user names for "Cleaned By"
  const allUsernames = cache.getUsernames ? cache.getUsernames() : cache.usernames || [];
  const cleanedByOptions = allUsernames.map((u) => u.Name || u["Full Name"]).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-500 shadow-lg shadow-sky-500/50">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
              Cleaning Log
            </h1>
            <p className="text-gray-400 text-sm mt-1">Record a new cleaning activity</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={form.Date}
                disabled
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model / Type</label>
              <select
                value={form["Model / Type"]}
                onChange={(e) => handleChange("Model / Type", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              >
                <option value="">--- Choose Model ---</option>
                {modelOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Plate Number</label>
              <select
                value={form["Plate Number"]}
                onChange={(e) => handleChange("Plate Number", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              >
                <option value="">--- Choose Plate ---</option>
                {plateOptions.length
                  ? plateOptions.map((p) => <option key={p} value={p}>{p}</option>)
                  : (cache.getEquipment?.() || []).map((e) => (
                      <option key={e["Plate Number"]} value={e["Plate Number"]}>
                        {e["Plate Number"]}
                      </option>
                    ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Driver</label>
              <select
                value={form.Driver}
                onChange={(e) => handleChange("Driver", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              >
                <option value="">--- Choose Driver ---</option>
                {driverOptions.length
                  ? driverOptions.map((d) => <option key={d} value={d}>{d}</option>)
                  : [...new Set(
                      (cache.getEquipment?.() || [])
                        .flatMap((eq) => [eq["Driver 1"], eq["Driver 2"], eq["Driver"]])
                        .filter(Boolean)
                    )].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cleaned By</label>
            <select
              value={form["Cleaned By"]}
              onChange={(e) => handleChange("Cleaned By", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            >
              <option value="">--- Select Cleaner ---</option>
              {cleanedByOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cleaning Type *</label>
            <select
              value={form["Cleaning Type"]}
              onChange={(e) => handleChange("Cleaning Type", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            >
              <option value="">--- Select Type ---</option>
              <option value="Blow Cleaning">Blow Cleaning</option>
              <option value="Water Wash">Water Wash</option>
              <option value="Full Cleaning (Air & Water)">Full Cleaning (Air & Water)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Comments</label>
            <textarea
              rows={3}
              value={form.Comments}
              onChange={(e) => handleChange("Comments", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
            />
          </div>

          {["Photo Before", "Photo After"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-3">{field}</label>
              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50">
                  <Upload size={18} />
                  <span className="font-medium">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0], field)}
                  />
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
                  <Camera size={18} />
                  <span className="font-medium">Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0], field)}
                  />
                </label>
              </div>
              {form[field] && (
                <div className="mt-4 p-2 bg-gray-800/30 rounded-xl border border-gray-700">
                  <img src={form[field]} alt={field} className="max-h-64 mx-auto rounded-lg object-contain" />
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
                Submitting...
              </span>
            ) : (
              "Submit Cleaning Log"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
