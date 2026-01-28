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

  const [form, setForm] = useState({
    Date: todayDate,
    "Model / Type": "",
    "Plate Number": "",
    Driver: "",
    "Description of Work": "",
    "Performed By": "",
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

  /* -------------------- LOAD INITIAL DATA -------------------- */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const hasModels = cache.getModels && cache.getModels().length > 0;
        const hasUsers = cache.getUsernames && cache.getUsernames().length > 0;

        if (!hasModels || !hasUsers) {
          await Promise.allSettled([
            cache.forceRefreshEquipment?.(),
            cache.forceRefreshUsernames?.(),
          ]);
        }

        setModelOptions(cache.getModels ? cache.getModels() : []);

        const users = cache.getUsernames ? cache.getUsernames() : [];
        const mechanics = (users || [])
          .filter((u) => u.Role === "Mechanic")
          .map((u) => u.Name)
          .filter(Boolean);

        setMechanicOptions(mechanics);

        // ✅ AUTO-SELECT LOGGED-IN MECHANIC
        if (
          user?.role === "Mechanic" &&
          user?.full_name &&
          mechanics.includes(user.full_name)
        ) {
          setForm((prev) => ({
            ...prev,
            "Performed By": user.full_name,
          }));
        }
      } catch (err) {
        console.error("Maintenance form init error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [cache, user]);

  /* -------------------- MODEL → PLATES -------------------- */
  useEffect(() => {
    if (!form["Model / Type"]) {
      setPlateOptions([]);
      return;
    }
    const plates = cache.getPlatesByModel
      ? cache.getPlatesByModel(form["Model / Type"])
      : [];
    setPlateOptions(plates);
  }, [form["Model / Type"], cache]);

  /* -------------------- PLATE → DRIVERS -------------------- */
  useEffect(() => {
    if (!form["Plate Number"]) {
      setDriverOptions([]);
      return;
    }
    const drivers = cache.getDriversByPlate
      ? cache.getDriversByPlate(form["Plate Number"])
      : [];
    setDriverOptions(drivers);
  }, [form["Plate Number"], cache]);

  /* -------------------- HANDLERS -------------------- */
  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => update(field, reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form["Description of Work"]) {
      alert(t("maintenance.form.alerts.missingDescription"));
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetchWithAuth("/api/add/Maintenance_Log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data?.status === "success") {
        alert(t("maintenance.form.alerts.success"));
        navigate("/maintenance/history");
      } else {
        alert(data?.message || t("maintenance.form.alerts.error"));
      }
    } catch {
      alert(t("maintenance.form.alerts.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <Loader2 className="animate-spin" size={40} />
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

        <div className="mb-6 flex items-center gap-4">
          <Wrench className="w-10 h-10 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold">
              {t("maintenance.form.title")}
            </h1>
            <p className="text-gray-400">
              {t("maintenance.form.subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Model */}
          <select
            value={form["Model / Type"]}
            onChange={(e) => update("Model / Type", e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700"
          >
            <option value="">{t("maintenance.form.chooseModel")}</option>
            {modelOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Plate */}
          <select
            value={form["Plate Number"]}
            onChange={(e) => update("Plate Number", e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700"
          >
            <option value="">{t("maintenance.form.choosePlate")}</option>
            {plateOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Driver */}
          <select
            value={form.Driver}
            onChange={(e) => update("Driver", e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700"
          >
            <option value="">{t("maintenance.form.chooseDriver")}</option>
            {driverOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* ✅ PERFORMED BY */}
          <select
            value={form["Performed By"]}
            onChange={(e) => update("Performed By", e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700"
          >
            <option value="">{t("maintenance.form.performedBy")}</option>
            {mechanicOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Description */}
          <textarea
            value={form["Description of Work"]}
            onChange={(e) =>
              update("Description of Work", e.target.value)
            }
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700"
            placeholder={t("maintenance.form.descriptionPlaceholder")}
            rows={4}
          />

          {/* Photos */}
          {["Photo Before", "Photo After", "Photo Repair/Problem"].map((field) => (
            <div key={field}>
              <label className="block mb-2 text-sm">{field}</label>
              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 bg-green-600 p-3 rounded-xl cursor-pointer">
                  <Upload size={18} />
                  {t("common.upload")}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      handleFile(e.target.files?.[0], field)
                    }
                  />
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 p-3 rounded-xl cursor-pointer">
                  <Camera size={18} />
                  {t("common.camera")}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    capture="environment"
                    onChange={(e) =>
                      handleFile(e.target.files?.[0], field)
                    }
                  />
                </label>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 font-semibold"
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
