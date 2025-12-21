// frontend/src/pages/Requests/Parts/PartsRequestForm.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import CONFIG from "@/config";
import { useTranslation } from "react-i18next";

export default function PartsRequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache(); // Get the cache context
  const { t } = useTranslation();

  const todayDate = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    "Request Date": todayDate,
    "Model / Type": "",
    "Plate Number": "",
    "Driver": "",
    "Requested Parts": "",
    "Status": "Pending", // Default status
    "Handled By": "", // Will be filled when status changes
    "Comments": "",
    "Attachment Photo": null,
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

  // Handle file upload (Attachment Photo)
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange("Attachment Photo", reader.result);
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
      // payload["Request Date"] = new Date(payload["Request Date"]).toLocaleDateString("en-GB");

      const res = await fetchWithAuth(`${CONFIG.BACKEND_URL}/api/add/Requests_Parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status === "success") {
        alert(t("requests.parts.form.alerts.success"));
        navigate("/requests/parts/current");
      } else {
        alert(`${t("requests.parts.form.alerts.error")}: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert(t("requests.parts.form.alerts.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
            {t("requests.parts.form.title")}
          </h1>
          <p className="text-gray-400 mt-2">{t("requests.parts.form.subtitle")}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Date */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("requests.parts.form.requestDate")}</label>
            <input
              type="date"
              value={form["Request Date"]}
              onChange={(e) => handleChange("Request Date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Model / Type */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("requests.parts.form.model")}</label>
            <select
              value={form["Model / Type"]}
              onChange={(e) => handleChange("Model / Type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("requests.parts.form.chooseModel")}</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("requests.parts.form.plate")}</label>
            <select
              value={form["Plate Number"]}
              onChange={(e) => handleChange("Plate Number", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("requests.parts.form.choosePlate")}</option>
              {plateOptions.map((plate) => (
                <option key={plate} value={plate}>{plate}</option>
              ))}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("requests.parts.form.driver")}</label>
            <select
              value={form["Driver"]}
              onChange={(e) => handleChange("Driver", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t("requests.parts.form.chooseDriver")}</option>
              {driverOptions.map((driver) => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </div>

          {/* Requested Parts */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("requests.parts.form.requestedParts")}</label>
            <textarea
              value={form["Requested Parts"]}
              onChange={(e) => handleChange("Requested Parts", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder={t("requests.parts.form.partsPlaceholder")}
              required
            ></textarea>
          </div>

          {/* Status (Hidden, defaults to Pending) */}
          <input type="hidden" value={form.Status} />

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("requests.parts.form.comments")}</label>
            <textarea
              value={form["Comments"]}
              onChange={(e) => handleChange("Comments", e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={t("requests.parts.form.commentsPlaceholder")}
            ></textarea>
          </div>

          {/* Attachment Photo */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("requests.parts.form.attachment")}</label>
            <div className="flex items-center gap-4">
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="mt-2 text-xs text-center text-gray-400">{t("requests.parts.form.upload")}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {form["Attachment Photo"] && (
                <div className="relative">
                  <img
                    src={form["Attachment Photo"]}
                    alt="Attachment"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange("Attachment Photo", null)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              submitting
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            } transition`}
          >
            {submitting ? t("requests.parts.form.submitting") : t("requests.parts.form.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
