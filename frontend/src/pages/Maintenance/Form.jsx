// frontend/src/pages/Maintenance/Form.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Wrench } from "lucide-react";
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

  const todayDate = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    Date: todayDate,
    "Model / Type": "",
    "Plate Number": "",
    Driver: "",
    "Description of Work": "",
    "Performed By": user?.full_name || "",
    Comments: "",
    "Photo Before": "",
    "Photo After": "",
    "Photo Repair/Problem": "",
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setModelOptions(cache.getModels ? cache.getModels() : []);
  }, [cache]);

  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      return;
    }
    setPlateOptions(
      cache.getPlatesByModel ? cache.getPlatesByModel(model) : []
    );
  }, [form["Model / Type"], cache]);

  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) {
      setDriverOptions([]);
      return;
    }
    const eq = cache.getEquipmentByPlate?.(plate);
    if (eq) {
      setForm((p) => ({
        ...p,
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
      setDriverOptions(cache.getDriversByPlate?.(plate) || []);
    }
  }, [form["Plate Number"], cache]);

  useEffect(() => {
    const driver = form.Driver;
    if (!driver) return;

    const allEquipment = cache.getEquipment?.() || [];
    const matches = allEquipment.filter(
      (e) =>
        e["Driver 1"] === driver ||
        e["Driver 2"] === driver ||
        e["Driver"] === driver
    );

    if (matches.length === 1) {
      const eq = matches[0];
      setForm((p) => ({
        ...p,
        "Plate Number": eq["Plate Number"],
        "Model / Type": eq["Model / Type"],
      }));
      setPlateOptions([eq["Plate Number"]]);
      setDriverOptions(
        [eq["Driver 1"], eq["Driver 2"]].filter(Boolean)
      );
    } else if (matches.length > 1) {
      setPlateOptions(matches.map((m) => m["Plate Number"]));
      setDriverOptions([
        ...new Set(
          matches.flatMap((m) => [m["Driver 1"], m["Driver 2"]]).filter(Boolean)
        ),
      ]);
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

    if (!form["Model / Type"] && !form["Plate Number"] && !form.Driver) {
      alert(t("maintenance.form.alerts.missingAsset"));
      return;
    }
    if (!form["Description of Work"]) {
      alert(t("maintenance.form.alerts.missingDescription"));
      return;
    }
    if (!form["Performed By"]) {
      alert(t("maintenance.form.alerts.missingPerformer"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/add/Maintenance_Log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  const cachedUsers = cache.getUsernames ? cache.getUsernames() : [];
  const performers = cachedUsers
    .filter((u) => ["Supervisor", "Mechanic"].includes(u.Role))
    .map((u) => u.Name || u["Full Name"])
    .filter(Boolean);

  if (user?.full_name && !performers.includes(user.full_name)) {
    performers.unshift(user.full_name);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto p-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {t("maintenance.form.title")}
            </h1>
            <p className="text-gray-400 text-sm">
              {t("maintenance.form.subtitle")}
            </p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date + Model */}
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
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

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
                {(plateOptions.length ? plateOptions : cache.getEquipment?.() || []).map(
                  (p) => {
                    const plate = typeof p === "string" ? p : p["Plate Number"];
                    return (
                      <option key={plate} value={plate}>{plate}</option>
                    );
                  }
                )}
              </select>
            </div>

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
                          .flatMap((e) => [e["Driver 1"], e["Driver 2"], e["Driver"]])
                          .filter(Boolean)
                      )
                    )
                ).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("maintenance.form.description")}
            </label>
            <textarea
              rows={4}
              value={form["Description of Work"]}
              onChange={(e) =>
                handleChange("Description of Work", e.target.value)
              }
              placeholder={t("maintenance.form.descriptionPlaceholder")}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
            />
          </div>

          {/* Performed By */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("maintenance.form.performedBy")}
            </label>
            <select
              value={form["Performed By"]}
              onChange={(e) =>
                handleChange("Performed By", e.target.value)
              }
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
            >
              <option value="">{t("maintenance.form.choosePerformer")}</option>
              {performers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Comments */}
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

          {/* Photos */}
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

          {/* Submit */}
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
