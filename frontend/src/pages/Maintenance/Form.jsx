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
    if (!form["Model / Type"]) {
      setPlateOptions([]);
      return;
    }
    setPlateOptions(
      cache.getPlatesByModel ? cache.getPlatesByModel(form["Model / Type"]) : []
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
      setDriverOptions([eq["Driver 1"], eq["Driver 2"]].filter(Boolean));
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
    .map((u) => u.Name)
    .filter(Boolean);

  if (user?.full_name && !performers.includes(user.full_name)) {
    performers.unshift(user.full_name);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
        >
          <ArrowLeft size={18} /> {t("common.back"
