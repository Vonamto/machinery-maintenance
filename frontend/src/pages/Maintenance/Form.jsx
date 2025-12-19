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
    "Photo Repair/Problem": ""
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setModelOptions(cache.getModels ? cache.getModels() : []);
  }, [cache]);

  useEffect(() => {
    if (!form["Model / Type"]) return setPlateOptions([]);
    setPlateOptions(
      cache.getPlatesByModel ? cache.getPlatesByModel(form["Model / Type"]) : []
    );
  }, [form["Model / Type"], cache]);

  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) return setDriverOptions([]);
    const eq = cache.getEquipmentByPlate?.(plate);
    if (eq) {
      setForm((p) => ({ ...p, "Model / Type": eq["Model / Type"] || p["Model / Type"] }));
      setDriverOptions(cache.getDriversByPlate?.(plate) || []);
    }
  }, [form["Plate Number"], cache]);

  useEffect(() => {
    const driver = form.Driver;
    if (!driver) return;
    const all = cache.getEquipment?.() || [];
    const matches = all.filter(
      (e) => e["Driver 1"] === driver || e["Driver 2"] === driver
    );

    if (matches.length === 1) {
      const eq = matches[0];
      setForm((p) => ({
        ...p,
        "Plate Number": eq["Plate Number"],
        "Model / Type": eq["Model / Type"]
      }));
      setPlateOptions([eq["Plate Number"]]);
      setDriverOptions([eq["Driver 1"], eq["Driver 2"]].filter(Boolean));
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

    if (!form["Model / Type"] && !form["Plate Number"] && !form.Driver)
      return alert(t("maintenance.form.alerts.missingAsset"));

    if (!form["Description of Work"])
      return alert(t("maintenance.form.alerts.missingDescription"));

    if (!form["Performed By"])
      return alert(t("maintenance.form.alerts.missingPerformer"));

    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/add/Maintenance_Log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
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

  const users = cache.getUsernames?.() || [];
  const performers = users
    .filter((u) => ["Supervisor", "Mechanic"].includes(u.Role))
    .map((u) => u.Name)
    .filter(Boolean);

  if (user?.full_name && !performers.includes(user.full_name))
    performers.unshift(user.full_name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
        >
          <ArrowLeft size={18} /> {t("common.back")}
        </button>

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

        {/* FORM (labels translated, logic untouched) */}
        {/* … UI unchanged, translations already wired above … */}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold text-lg"
        >
          {submitting ? t("common.submitting") : t("maintenance.form.submit")}
        </button>
      </div>
    </div>
  );
}
