// frontend/src/pages/Maintenance/Form.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import CONFIG from "@/config";
import { useTranslation } from "react-i18next";

export default function MaintenanceForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache(); // Get the cache context
  const { t } = useTranslation();

  const todayDate = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    "Date": todayDate,
    "Model / Type": "",
    "Plate Number": "",
    "Driver": "",
    "KMs Reading": "",
    "Hours Reading": "",
    "Lubrication": "",
    "Greasing": "",
    "Filters": "",
    "Repairs": "",
    "Other Work Done": "",
    "Next Service KMs": "",
    "Next Service Hours": "",
    "Performed By": user?.full_name || "", // Pre-fill with user's name
    "Photo Before": null,
    "Photo After": null,
    "Comments": ""
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Update modelOptions whenever cache changes (equipment data updates)
  useEffect(() => {
    const models = cache.getModels ? cache.getModels() : [];
    setModelOptions(models);
  }, [cache]); // Dependency is the cache object itself

  // Update plateOptions based on the selected model AND the cache
  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      return;
    }
    const plates = cache.getPlatesByModel ? cache.getPlatesByModel(model) : [];
    setPlateOptions(plates);
  }, [form["Model / Type"], cache]); // Include cache dependency

  // Update driverOptions based on the selected plate AND the cache
  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) {
      setDriverOptions([]);
      return;
    }
    const drivers = cache.getDriversByPlate ? cache.getDriversByPlate(plate) : [];
    setDriverOptions(drivers);
  }, [form["Plate Number"], cache]); // Include cache dependency


  const handleChange = (name, value) => {
    setForm(prevForm => {
      let updatedForm = { ...prevForm, [name]: value };

      // Clear dependent fields when parent changes to prevent invalid selections
      if (name === "Model / Type") {
        updatedForm["Plate Number"] = "";
        updatedForm["Driver"] = "";
      }
      if (name === "Plate Number") {
        updatedForm["Driver"] = "";
      }

      return updatedForm;
    });
  };

  // Handle file uploads (Photo Before, Photo After)
  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange(field, reader.result);
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const payload = { ...form };
      // Ensure date is formatted correctly if needed by backend
      // payload["Date"] = new Date(payload["Date"]).toLocaleDateString("en-GB");

      const res = await fetchWithAuth(`${CONFIG.BACKEND_URL}/api/add/Maintenance_Log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status === "success") {
        alert(t("maintenance.form.alerts.success"));
        navigate("/maintenance");
      } else {
        alert(`${t("maintenance.form.alerts.error")}: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert(t("maintenance.form.alerts.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  const performers = [...new Set([user?.full_name, ...(form["Performed By"] ? [form["Performed By"]] : [])])].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            {t("maintenance.form.title")}
          </h1>
          <p className="text-gray-400 mt-2">{t("maintenance.form.subtitle")}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.date")}</label>
            <input
              type="date"
              value={form.Date}
              onChange={(e) => handleChange("Date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Model / Type */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.model")}</label>
            <select
              value={form["Model / Type"]}
              onChange={(e) => handleChange("Model / Type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("maintenance.form.chooseModel")}</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.plate")}</label>
            <select
              value={form["Plate Number"]}
              onChange={(e) => handleChange("Plate Number", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("maintenance.form.choosePlate")}</option>
              {plateOptions.map((plate) => (
                <option key={plate} value={plate}>{plate}</option>
              ))}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.driver")}</label>
            <select
              value={form["Driver"]}
              onChange={(e) => handleChange("Driver", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("maintenance.form.chooseDriver")}</option>
              {driverOptions.map((driver) => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </div>

          {/* KMs Reading */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.kmsReading")}</label>
            <input
              type="number"
              value={form["KMs Reading"]}
              onChange={(e) => handleChange("KMs Reading", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("maintenance.form.kmsPlaceholder")}
            />
          </div>

          {/* Hours Reading */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.hoursReading")}</label>
            <input
              type="number"
              value={form["Hours Reading"]}
              onChange={(e) => handleChange("Hours Reading", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("maintenance.form.hoursPlaceholder")}
            />
          </div>

          {/* Lubrication */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.lubrication")}</label>
            <textarea
              value={form["Lubrication"]}
              onChange={(e) => handleChange("Lubrication", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("maintenance.form.lubricationPlaceholder")}
            ></textarea>
          </div>

          {/* Greasing */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.greasing")}</label>
            <textarea
              value={form["Greasing"]}
              onChange={(e) => handleChange("Greasing", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("maintenance.form.greasingPlaceholder")}
            ></textarea>
          </div>

          {/* Filters */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.filters")}</label>
            <textarea
              value={form["Filters"]}
              onChange={(e) => handleChange("Filters", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("maintenance.form.filtersPlaceholder")}
            ></textarea>
          </div>

          {/* Repairs */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.repairs")}</label>
            <textarea
              value={form["Repairs"]}
              onChange={(e) => handleChange("Repairs", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("maintenance.form.repairsPlaceholder")}
            ></textarea>
          </div>

          {/* Other Work Done */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.otherWorkDone")}</label>
            <textarea
              value={form["Other Work Done"]}
              onChange={(e) => handleChange("Other Work Done", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("maintenance.form.otherWorkDonePlaceholder")}
            ></textarea>
          </div>

          {/* Next Service KMs */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.nextServiceKMs")}</label>
            <input
              type="number"
              value={form["Next Service KMs"]}
              onChange={(e) => handleChange("Next Service KMs", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("maintenance.form.nextServiceKMsPlaceholder")}
            />
          </div>

          {/* Next Service Hours */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.nextServiceHours")}</label>
            <input
              type="number"
              value={form["Next Service Hours"]}
              onChange={(e) => handleChange("Next Service Hours", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("maintenance.form.nextServiceHoursPlaceholder")}
            />
          </div>

          {/* Performed By */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.performedBy")}</label>
            <select
              value={form["Performed By"]}
              onChange={(e) => handleChange("Performed By", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("maintenance.form.choosePerformer")}</option>
              {performers.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Photo Before */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.photoBefore")}</label>
            <div className="flex items-center gap-4">
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="mt-2 text-xs text-center text-gray-400">{t("maintenance.form.upload")}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e.target.files[0], "Photo Before")}
                  className="hidden"
                />
              </label>
              {form["Photo Before"] && (
                <div className="relative">
                  <img
                    src={form["Photo Before"]}
                    alt="Before"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange("Photo Before", null)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Photo After */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.photoAfter")}</label>
            <div className="flex items-center gap-4">
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="mt-2 text-xs text-center text-gray-400">{t("maintenance.form.upload")}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e.target.files[0], "Photo After")}
                  className="hidden"
                />
              </label>
              {form["Photo After"] && (
                <div className="relative">
                  <img
                    src={form["Photo After"]}
                    alt="After"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange("Photo After", null)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("maintenance.form.comments")}</label>
            <textarea
              value={form["Comments"]}
              onChange={(e) => handleChange("Comments", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder={t("maintenance.form.commentsPlaceholder")}
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              submitting
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            } transition`}
          >
            {submitting ? t("maintenance.form.submitting") : t("maintenance.form.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
