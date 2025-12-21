// frontend/src/pages/Cleaning/CleaningForm.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Droplets } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import CONFIG from "@/config";
import { useTranslation } from "react-i18next";

export default function CleaningForm() {
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
    "Cleaner": user?.full_name || "", // Pre-fill with user's name if applicable
    "Exterior Cleaning": "",
    "Interior Cleaning": "",
    "Engine Cleaning": "",
    "Other Services": "",
    "Performed By": user?.full_name || "",
    "Photo Before": null,
    "Photo After": null,
    "Comments": ""
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [cleanerOptions, setCleanerOptions] = useState([]); // Use usernames for cleaner
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

  // Update cleanerOptions based on usernames cache
  useEffect(() => {
    const usernames = cache.getUsernames ? cache.getUsernames() : [];
    const cleaners = usernames.map(u => u.Name || u["Full Name"] || u.Username).filter(Boolean);
    setCleanerOptions(cleaners);
  }, [cache]); // Include cache dependency


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

      const res = await fetchWithAuth(`${CONFIG.BACKEND_URL}/api/add/Cleaning_Log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // Combine current user and selected cleaner for 'Performed By' dropdown
  const performers = [...new Set([user?.full_name, form["Cleaner"], ...(form["Performed By"] ? [form["Performed By"]] : [])])].filter(Boolean);

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
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
            {t("cleaning.form.title")}
          </h1>
          <p className="text-gray-400 mt-2">{t("cleaning.form.subtitle")}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.date")}</label>
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
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.model")}</label>
            <select
              value={form["Model / Type"]}
              onChange={(e) => handleChange("Model / Type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("cleaning.form.chooseModel")}</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.plate")}</label>
            <select
              value={form["Plate Number"]}
              onChange={(e) => handleChange("Plate Number", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("cleaning.form.choosePlate")}</option>
              {plateOptions.map((plate) => (
                <option key={plate} value={plate}>{plate}</option>
              ))}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.driver")}</label>
            <select
              value={form["Driver"]}
              onChange={(e) => handleChange("Driver", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("cleaning.form.chooseDriver")}</option>
              {driverOptions.map((driver) => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </div>

          {/* Cleaner */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.cleaner")}</label>
            <select
              value={form["Cleaner"]}
              onChange={(e) => handleChange("Cleaner", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("cleaning.form.chooseCleaner")}</option>
              {cleanerOptions.map((cleaner) => (
                <option key={cleaner} value={cleaner}>{cleaner}</option>
              ))}
            </select>
          </div>

          {/* Exterior Cleaning */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.exteriorCleaning")}</label>
            <textarea
              value={form["Exterior Cleaning"]}
              onChange={(e) => handleChange("Exterior Cleaning", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("cleaning.form.exteriorPlaceholder")}
            ></textarea>
          </div>

          {/* Interior Cleaning */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.interiorCleaning")}</label>
            <textarea
              value={form["Interior Cleaning"]}
              onChange={(e) => handleChange("Interior Cleaning", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("cleaning.form.interiorPlaceholder")}
            ></textarea>
          </div>

          {/* Engine Cleaning */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.engineCleaning")}</label>
            <textarea
              value={form["Engine Cleaning"]}
              onChange={(e) => handleChange("Engine Cleaning", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("cleaning.form.enginePlaceholder")}
            ></textarea>
          </div>

          {/* Other Services */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.otherServices")}</label>
            <textarea
              value={form["Other Services"]}
              onChange={(e) => handleChange("Other Services", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("cleaning.form.otherPlaceholder")}
            ></textarea>
          </div>

          {/* Performed By */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.performedBy")}</label>
            <select
              value={form["Performed By"]}
              onChange={(e) => handleChange("Performed By", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("cleaning.form.choosePerformer")}</option>
              {performers.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Photo Before */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.photoBefore")}</label>
            <div className="flex items-center gap-4">
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="mt-2 text-xs text-center text-gray-400">{t("cleaning.form.upload")}</span>
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
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.photoAfter")}</label>
            <div className="flex items-center gap-4">
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="mt-2 text-xs text-center text-gray-400">{t("cleaning.form.upload")}</span>
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
            <label className="block text-sm font-medium mb-2">{t("cleaning.form.comments")}</label>
            <textarea
              value={form["Comments"]}
              onChange={(e) => handleChange("Comments", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder={t("cleaning.form.commentsPlaceholder")}
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              submitting
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700"
            } transition`}
          >
            {submitting ? t("cleaning.form.submitting") : t("cleaning.form.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
