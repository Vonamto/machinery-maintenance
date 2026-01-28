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

  // Description options (i18n-safe)
  const DESCRIPTION_OPTIONS = [
    { key: "Oil Service", label: t("requestTypes.Oil Service") },
    { key: "Grease Service", label: t("requestTypes.Grease Service") },
    {
      key: "Full Service (Oil + Greasing)",
      label: t("requestTypes.Full Service (Oil + Greasing)"),
    },
    { key: "OTHER", label: t("maintenance.form.otherOption") },
  ];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (!cache.getModels?.().length) {
          await cache.forceRefreshEquipment?.();
        }

        if (!cache.getUsernames?.().length) {
          await cache.forceRefreshUsernames?.();
        }

        setModelOptions(cache.getModels?.() || []);

        const mechanics = (cache.getUsernames?.() || [])
          .filter((u) => u.Role === "Mechanic")
          .map((u) => u.Name);

        setMechanicOptions(mechanics);

        // ✅ Auto-select logged-in mechanic
        if (
          user?.role === "Mechanic" &&
          mechanics.includes(user.full_name)
        ) {
          setForm((p) => ({
            ...p,
            "Performed By": user.full_name,
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [cache, user]);

  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      return;
    }
    setPlateOptions(cache.getPlatesByModel?.(model) || []);
  }, [form["Model / Type"], cache]);

  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) return;

    const eq = cache.getEquipmentByPlate?.(plate);
    if (eq) {
      setForm((p) => ({
        ...p,
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
      setDriverOptions(cache.getDriversByPlate?.(plate) || []);
    }
  }, [form["Plate Number"], cache]);

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

    const finalDescription =
      descriptionType === "OTHER"
        ? otherDescription.trim()
        : descriptionType;

    if (!form["Performed By"]) {
      alert(t("maintenance.form.alerts.missingPerformedBy"));
      return;
    }

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
        alert(`❌ ${t("maintenance.form.alerts.error")}`);
      }
    } catch {
      alert(`⚠️ ${t("maintenance.form.alerts.networkError")}`);
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="text-3xl font-bold">
              {t("maintenance.form.title")}
            </h1>
            <p className="text-gray-400 text-sm">
              {t("maintenance.form.subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ✅ Performed By */}
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
              <option value="">
                {t("maintenance.form.chooseMechanic")}
              </option>
              {mechanicOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

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
